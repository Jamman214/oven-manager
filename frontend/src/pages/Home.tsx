
function Home() {
    return (
        <div className="text">
            This is dashboard for monitoring and controlling an AGA oven.<br/><br/>
    
            <b><u>Page Descriptions:</u></b><br/>
            <ul>
                <li>
                    <b><u>Config:</u></b><br/>
                    This is where the AGA's temperature can be set to a preset.
                </li>
                <br/>
                <li>
                    <b><u>Presets:</u></b><br/>
                    This is where each of the three preset types can be created:
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
                    This is where you can view the temperature and preset at any point within the last week.
                </li>
                <br/>
            </ul>
        </div>
    )
}

export default Home;
