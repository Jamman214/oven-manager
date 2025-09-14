
function Home() {
    return (
        <div className="text">
            This is an website for monitoring and controlling my AGA oven. <br/><br/>
    
            <b><u>Page Descriptions:</u></b><br/>
            <ul>
                <li>
                    <b><u>Config:</u></b><br/>
                    This is where the AGA can be set to follow a single preset.
                </li>
                <br/>
                <li>
                    <b><u>Presets:</u></b><br/>
                    This is where you can create or edit any of the three following types of preset:
                    <ul>
                        <br/>
                        <li>
                            <b><u>Atomic:</u></b><br/>
                            Consists of two temperature ranges: one for the core, and one for the oven.
                        </li>
                        <br/>
                        <li>
                            <b><u>Day:</u></b><br/>
                            Consists of any number of atomic presets scheduled throughout the day.
                        </li>
                        <br/>
                        <li>
                            <b><u>Week:</u></b><br/>
                            Consists of a single atomic or day preset for each day of the week.
                        </li>
                    </ul>
                </li>
                <br/>
                <li>
                    <b><u>History:</u></b><br/>
                    This is where past temperatures can be viewed alongside the target temperatures at the time. You can zoom in on a specific time by selecting an area then using the buttons.
                </li>
                <br/>
            </ul>
        </div>
    )
}

export default Home;
