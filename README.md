# IOT Oven Temperature Controller
A full-stack application to add web-based temperature control and scheduling to an AGA oven using a Raspberry Pi.

## The Problem
My traditional AGA oven has no easy way to accurately change the temperature. This project was built to modernize it, providing the ability to set and schedule temperatures remotely via a web interface, making it more efficient and convenient to use.

## Key Features
<ul>
  <li>Web-based Interface: Oven can be controlled over the LAN.</li>
  
  <li>
    Hierarchical Preset System: Create complex heating schedules with three levels of reusable presets:
    <ul>
      <li>Atomic Presets: Set independent temperature ranges for both the oven and its core.</li>
      <li>Day Presets: Schedule atomic presets to run at different times throughout the day.</li>
      <li>Week Presets: Schedule one atomic or day preset for each day of the week.</li>
    </ul>
  </li>
 <li>Real-time Temperature Monitoring: Displays real time temperature information collected by the Pi.</li>
</ul>

## Tech Stack & Architecture
This project is a full-stack application with a hardware component.
<ul>
<li>Frontend: Typescript with React</li>

<li>Backend: Python with Flask</li>

<li>Web Server: Nginx (serves the static React frontend and reverse proxies API requests to the Flask backend)</li>

<li>Hardware: Raspberry Pi Zero W</li>

<li>Hardware Interfacing: A Python script using GPIO to read from a temperature sensor and trigger hardware relays.</li>
</ul>

## How It Works
The React frontend provides the user interface for creating presets and choosing which one is active. This data is sent to the Flask backend API, which validates and stores it in the SQLite database. A separate Python script running on the Raspberry Pi shares the database so can detect the current target temperature range. Each minute this script polls the AGA and database then decides whether to turn on the heating element (for the core), or the fan (for the oven). It also makes sure to oscillate between the high and low temperatures provided by the preset to prevent changing state too often.
