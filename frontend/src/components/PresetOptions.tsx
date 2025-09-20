
interface Preset {
    id: number;
    name: string;
}
interface PresetGroupProps {
    label: string;
    presets: Preset[];
}
function PresetGroup ({label, presets}: PresetGroupProps) {
    if (!presets.length) return null;
    return <optgroup label={label}>
        {
            presets.map(
                (preset) => (
                    <option 
                        key={preset.id} 
                        value={preset.id.toString()}
                    >
                        {preset.name}
                    </option>  
                )
            )
        }
    </optgroup>
}

interface PresetSelectProps {
    presets: {
        atomic?: Preset[];
        day?: Preset[];
        week?: Preset[];
    };
}

function PresetOptions({presets}: PresetSelectProps) {
    return <>
        <option value="0">Off</option> 
        { presets.atomic && <PresetGroup label="Atomic" presets={presets.atomic}/> }
        { presets.day && <PresetGroup label="Day" presets={presets.day}/> }
        { presets.week && <PresetGroup label="Week" presets={presets.week}/> }
    </>
}

export {PresetOptions};