import { useMemo, useState, useRef, useCallback, useEffect, type ComponentProps } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, type TooltipContentProps, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useGetJson } from "../hooks/useGetJSON";
import { historyDataSchema } from "../../validation/history"
import type { CategoricalChartFunc } from "recharts/types/chart/types";

interface DataPoint {
    core: number;
    oven: number;
    time: number;
    coreOn: boolean;
    ovenOn: boolean;
}
interface Box {
    max: number;
    min: number;
    start: number;
    end: number;
}

interface TimeWindow {
    start: number;
    end: number;
}

interface GraphDataState {
    data: DataPoint[];
    coreBoxes: Box[];
    ovenBoxes: Box[];
    domain: TimeWindow;
}
interface PrevGraphSelection {
    prevSelectionStart: number | null;
    prevSelectionEnd: number | null;
}
interface ConfirmedGraphSelection {
    currentSelectionStart: number;
    currentSelectionEnd: number;
    currentSelectionConfirmed: true;
}
interface UnconfirmedGraphSelection {
    currentSelectionStart: number | null;
    currentSelectionEnd: number | null;
    currentSelectionConfirmed: false;
}
type GraphState = (
    GraphDataState & PrevGraphSelection & (
        ConfirmedGraphSelection | UnconfirmedGraphSelection
    )
)


const getEveryNthMerged = (arr: DataPoint[], n: number) => {
    if (n <= 0) return arr;
    let output = []
    for (let i=0; i<arr.length; i+=n) {
        let timeTotal = 0
        let coreTotal = 0
        let ovenTotal = 0
        let coreOnTotal = 0
        let ovenOnTotal = 0
        let j=0;
        for (j=0; j<n && i+j < arr.length; j++) {
            timeTotal += arr[i+j].time;
            coreTotal += arr[i+j].core;
            ovenTotal += arr[i+j].oven;
            coreOnTotal += arr[i+j].coreOn ? 1 : 0;
            ovenOnTotal += arr[i+j].ovenOn ? 1 : 0;
        }

        output.push({
            time: timeTotal / j, 
            core: coreTotal / j, 
            oven: ovenTotal / j,
            coreOn: Boolean(Math.round(coreOnTotal / j)),
            ovenOn: Boolean(Math.round(ovenOnTotal / j))
        });

    }
    return output;
}

const binSearch = <T, S extends string | number>(arr: T[], val: S, f: (x:T) => S, mode: "lb" | "ub") => {
    if (arr.length === 0) {
        return null;
    }
    let lp = 0;
    let rp = arr.length - 1;
    let mp = 0
    while (lp <= rp) {
        mp = Math.floor((lp + rp) / 2)
        if (f(arr[mp]) === val) {
            return mp;
        } else if (val > f(arr[mp])) {
            lp = mp + 1;
        } else if (val < f(arr[mp])) {
            rp = mp - 1;
        }
    }
    switch (mode) {
        case "lb":
            return lp;
        case "ub":
            return rp;
    }
}

const getDataBetween = (arr: DataPoint[], start: number, end: number) => {
    const minIndex = binSearch(arr, start, (x) => x.time, "lb");
    const maxIndex = binSearch(arr, end, (x) => x.time, "ub");
    if (minIndex === null || maxIndex === null) return [];
    const numPoints = maxIndex - minIndex + 1;
    const interval = Math.ceil(numPoints / 30);
    return getEveryNthMerged(arr.slice(minIndex, maxIndex + 1), interval)
}

const getBoxesBetween = (arr: Box[], start: number, end: number) => {
    let startIndex = 0;
    let endIndex = arr.length - 1;
    let i = 0;
    for (; i<arr.length; i++) {
        if (arr[i].start <= start && start < arr[i].end) {
            startIndex = i;
            break;
        }
    }
    for (; i<arr.length; i++) {
        if (arr[i].start < end && end <= arr[i].end) {
            endIndex = i;
            break;
        }
    }
    const output = structuredClone(arr.slice(startIndex, endIndex + 1));
    if (output.length === 0) return output;
    output[0].start = Math.max(output[0].start, start);
    output[output.length-1].end = Math.min(output[output.length-1].end, end);
    return output;
}

const getStateBetween = <
        T extends GraphDataState
    >(graphState: T, window: TimeWindow) => ({
        data: getDataBetween(graphState.data, window.start, window.end),
        coreBoxes: getBoxesBetween(graphState.coreBoxes, window.start, window.end),
        ovenBoxes: getBoxesBetween(graphState.ovenBoxes, window.start, window.end),
        domain: window,
    })

type Formatter = (x: number) => string;

function CustomTooltip({ active, payload, label }: TooltipContentProps<number, number>) {    
    const isVisible = active && payload && payload.length;
    if (!isVisible) return null;

    const data: DataPoint = payload[0].payload;
    const formatter: Formatter = (unixTime: number) => new Date(unixTime).toLocaleString('en-GB', {timeZone: 'Europe/London'})
    const isOn = (on: boolean) => on ? "On" : "Off";

    return typeof label === "number" && (
        <div className="custom-tooltip" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
            <h1>{formatter(label)}</h1>
            <p><b>Core:</b> {data.core.toFixed(2)}°C - {isOn(data.coreOn)}</p>
            <p><b>Oven:</b> {data.oven.toFixed(2)}°C - {isOn(data.coreOn)}</p>
        </div>
    );
};

const allowableTicks: [number, "time"|"date"][] = [
    [1, "time"], 
    [2, "time"], 
    [5, "time"], 
    [10, "time"], 
    [30, "time"], 
    [60, "time"], 
    [120, "time"], 
    [180, "time"], 
    [360, "time"], 
    [720, "time"], 
    [1440, "date"], 
]

const useZoomedData = (duration: "hour" | "day" | "week", touchSelectEnabled: boolean) => {
    const [fetchedRawData, _isDataLoading, _dataError] = useGetJson(
        "/api/get/history",
        historyDataSchema,
        { 
            dependencies: [duration] 
        },
        { duration }
    );

    const emptySelection = {
        prevSelectionStart: null,
        prevSelectionEnd: null,
        currentSelectionStart: null,
        currentSelectionEnd: null,
        currentSelectionConfirmed: false
    } as const

    const rawData = useMemo(
        () => {
            const data = fetchedRawData?.data || [];
            const coreBoxes = fetchedRawData?.limit?.core || [];
            const ovenBoxes = fetchedRawData?.limit?.oven || [];
            const domain = {
                start: fetchedRawData?.start || 0,
                end: fetchedRawData?.end || 0
            }
            return {data, coreBoxes, ovenBoxes, domain}
        }, [fetchedRawData]
    )

    const initialGraphState = useMemo(
        () => {
            let graphDataState = rawData;
            if (rawData.data.length > 0) {
                graphDataState = getStateBetween(rawData, rawData.domain);
            }

            return { 
                ...graphDataState,
                ...emptySelection
            } as const
        }, [fetchedRawData]
    )

    const [graphState, setGraphState] = useState<GraphState>(initialGraphState);  

    const zoomHistory = useRef<{start: number, end: number}[]>([])

    useEffect(
        () => {
            setGraphState(initialGraphState);
            zoomHistory.current = []
        }, [initialGraphState]
    )

    const zoomIn = () => {
        const { 
            currentSelectionStart, 
            currentSelectionEnd, 
            currentSelectionConfirmed 
        } = graphState;

        if (!currentSelectionConfirmed) return

        const [selectionLeft, selectionRight] = (currentSelectionStart < currentSelectionEnd)
            ? [currentSelectionStart, currentSelectionEnd]
            : [currentSelectionEnd, currentSelectionStart]

        // Store selection data since averaging points makes the original selection unrecoverable
        const newWindow = {start: selectionLeft, end: selectionRight};
        zoomHistory.current.push(newWindow);

        setGraphState({
            ...getStateBetween(rawData, newWindow),
            ...emptySelection
        });
    };

    const zoomOut = () => {
        zoomHistory.current.pop() // remove current selection
        // Get previous selection, or go back to rawData if there arent any
        const prevWindow = zoomHistory.current.length === 0 
            ? rawData.domain
            : zoomHistory.current[zoomHistory.current.length-1]
        if (!prevWindow) return;
        setGraphState({
            ...getStateBetween(rawData, prevWindow),
            ...emptySelection
        });
    };

    const selectionStartHandler: CategoricalChartFunc = (e) => {
        const time = e.activeLabel;
        if (typeof time !== "number") return;
        setGraphState(
            prevState => {
                return { 
                    ...prevState, 
                    currentSelectionStart: time, 
                    currentSelectionEnd: null, 
                    currentSelectionConfirmed: false 
                };
            }
        )
    }

    const selectionMoveMouseHandler: CategoricalChartFunc = (e) => {
        const time = e.activeLabel;
        if (typeof time !== "number") return;
        setGraphState(
            prevState => {
                if (
                    prevState.currentSelectionConfirmed 
                    || prevState.currentSelectionStart === null
                ) {
                    return prevState;
                }
                return { ...prevState, currentSelectionEnd: time };
            }
        )
    }

    const selectionMoveTouchHandler: CategoricalChartFunc = (e) => {
        const time = e.activeLabel;
        if (typeof time !== "number") return;
        setGraphState(
            prevState => {
                if (
                    prevState.currentSelectionConfirmed 
                    || prevState.currentSelectionStart === null
                ) {
                    return { 
                        ...prevState, 
                        currentSelectionStart: time, 
                        currentSelectionEnd: null, 
                        currentSelectionConfirmed: false 
                    }
                }
                return { ...prevState, currentSelectionEnd: time }
            }
        )
    }

    const selectionEndHandler: CategoricalChartFunc = (e) => {
        setGraphState(
            prevState => {
                if (prevState.currentSelectionConfirmed) return prevState;

                const selectionStart = prevState.currentSelectionStart;
                const selectionEnd = prevState.currentSelectionEnd;
                if (
                    selectionStart === null
                    || selectionEnd === null
                    || selectionStart === selectionEnd
                ) {
                    return { 
                        ...prevState, 
                        ...emptySelection
                    }
                }
                // Needed to separate selectionStart, selectionEnd for type safety
                return { 
                    ...prevState, 
                    prevSelectionStart: selectionStart,
                    prevSelectionEnd: selectionEnd,
                    currentSelectionStart: selectionStart, 
                    currentSelectionEnd: selectionEnd, 
                    currentSelectionConfirmed: true 
                }
            }
        )
    }

    const selectionProps: ComponentProps<typeof LineChart> = {
        onMouseDown: selectionStartHandler,
        onMouseMove: selectionMoveMouseHandler,
        onMouseUp: selectionEndHandler,
        ...touchSelectEnabled ? {
            onTouchMove: selectionMoveTouchHandler,
            onTouchEnd: selectionEndHandler,
        } : {}
    }

    return {graphState, selectionProps, zoomIn, zoomOut}
}

function History() {
    const isTouchScreen = ( 'ontouchstart' in window ) || ( navigator.maxTouchPoints > 0 );
    const [duration, setDuration] = useState<"hour" | "day" | "week">("hour")

    const [touchSelectEnabled, setTouchSelectEnabled] = useState(false);
    const {
        graphState : {
            data,
            coreBoxes,
            ovenBoxes,
            domain,
            currentSelectionStart,
            currentSelectionEnd,
            prevSelectionStart,
            prevSelectionEnd,
            currentSelectionConfirmed
        }, 
        selectionProps,
        zoomIn, 
        zoomOut
    } = useZoomedData(duration, touchSelectEnabled)

    const chartRef = useRef<any>(null);
    const chartProps: ComponentProps<typeof LineChart> = {
        ...selectionProps,
        ref: chartRef,
    }
    

    const selectionChanging = 
        currentSelectionStart !== prevSelectionStart
        || currentSelectionEnd !== prevSelectionEnd

    const showCurrent = 
        !currentSelectionConfirmed 
        && currentSelectionStart !== null
        && currentSelectionEnd !== null
    
    const showPrev = 
        prevSelectionStart !== null
        && prevSelectionEnd !== null
    

    const genTimeTicks = (data: DataPoint[]) => {
        let minTime = data[0]?.time || 0;
        let maxTime = data[data.length-1]?.time || 0

        const difference = maxTime - minTime
        let i=0;
        while(i !== allowableTicks.length-1 && allowableTicks[i][0] * 6 * 60 * 1000 < difference) {
            i++;
        }
        const tickStep = allowableTicks[i][0] * 60 * 1000
        const axisType = allowableTicks[i][1]
        const minTick = Math.ceil(minTime / tickStep) * tickStep;
        const maxTick = Math.floor(maxTime / tickStep) * tickStep;

        const output = []
        i = 0;
        while (minTick + i * tickStep <= maxTick) {
            output.push(minTick + i * tickStep);
            i++;
        }
        return [output, axisType] as const
    }

    const dateFormatter = useCallback((unixTime: number) => new Date(unixTime).toLocaleDateString('en-GB', {timeZone: 'Europe/London'}), [])
    const timeFormatter = useCallback((unixTime: number) => new Date(unixTime).toLocaleTimeString('en-GB', {timeZone: 'Europe/London'}), [])

    const [xTicks, tickType] = useMemo(() => genTimeTicks(data), [data]);

    const tickFormatter = (tickType === "time") 
        ? timeFormatter
        : dateFormatter
    
    return <>
        <div className="container">
            <div className="buttonGroup spaceBelow">
                <select onChange={(e) => setDuration(e.currentTarget.value as "day" | "hour" | "week")}>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={data}
                    margin={{
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 0,
                    }}
                    {...(chartProps)}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        allowDataOverflow
                        dataKey="time"
                        domain={[domain.start, domain.end]}
                        type="number"
                        scale="time"
                        ticks={xTicks}
                        tickFormatter={tickFormatter}
                        minTickGap={30}
                        tickMargin={10}
                    />
                    <YAxis ticks={[0, 100, 200, 300, 400, 500]} width="auto"/>
                    <Tooltip content={CustomTooltip} offset={20}/>
                    <Line 
                        name="Core"
                        type="monotone" 
                        dataKey="core" 
                        stroke="#8884d8" 
                        dot={{ 
                            stroke: 'red', 
                            strokeWidth: 2,
                            fill: "orange",
                            r: 2 
                        }}
                        activeDot={{ 
                            stroke: 'red', 
                            strokeWidth: 4,
                            fill: "orange",
                            r: 4
                        }} 
                        isAnimationActive={false}
                    />
                    <Line 
                        name="Oven"
                        type="monotone" 
                        dataKey="oven" 
                        stroke="#8884d8" 
                        dot={{ 
                            stroke: 'orange', 
                            strokeWidth: 2,
                            fill: "yellow",
                            r: 2
                        }}
                        activeDot={{ 
                            stroke: 'orange', 
                            strokeWidth: 4,
                            fill: "yellow",
                            r: 4
                        }} 
                        isAnimationActive={false}
                    />
                    {
                        coreBoxes.map(
                            (box, i) => (
                                <ReferenceArea ifOverflow="extendDomain" key={`${box.start}`} x1={box.start} x2={box.end} y1={box.min} y2={box.max} stroke="red" strokeOpacity={0.5} fill="red" fillOpacity={0.3} />
                            )
                        )
                    }
                    {
                        ovenBoxes.map(
                            (box, i) => (
                                <ReferenceArea ifOverflow="extendDomain" key={`${box.start}`} x1={box.start} x2={box.end} y1={box.min} y2={box.max} stroke="orange" strokeOpacity={0.5} fill="orange" fillOpacity={0.3} />
                            )
                        )
                    }
                    {
                        // Solution to issue on mobile when starting a selection within the current selection.
                        // With only one referenceArea, starting a new one causes the old one to dissapear 
                        // and prevents the onTouchMove from being handled
                        showPrev ? (
                            <ReferenceArea x1={prevSelectionStart} x2={prevSelectionEnd} stroke="yellow" strokeOpacity={selectionChanging ? 0 : 0.2} fill="yellow" fillOpacity={selectionChanging ? 0 : 0.1} />
                        ) : null
                    }
                    {
                        showCurrent ? (<>
                            <ReferenceArea x1={currentSelectionStart} x2={currentSelectionEnd} stroke="yellow" strokeOpacity={0.2} fill="yellow" fillOpacity={0.1} />
                        </>) : null
                    }
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="buttonGroup container">
            <button type="button" onClick={zoomOut} className="formButton">
                -
            </button>
            {
                isTouchScreen && (
                    <label className="switch">
                        <input type="checkbox" onChange={() => setTouchSelectEnabled(p => !p)}/>
                        <span className="slider round"></span>
                    </label>
                )
            }
            <button type="button" onClick={zoomIn} className="formButton">
                +
            </button>
        </div>
    </>
}

export default History;