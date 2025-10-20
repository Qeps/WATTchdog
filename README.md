# Wattchdog – IoT Project for Monitoring Local Power Consumption

This project focuses on monitoring power consumption in a local area using IoT technologies.
It consists of the following components:

- Measurement Circuit Simulation (LTSpice):
  Simulations of the measurement system performed in LTSpice to validate circuit design and behavior.

- Host Service (Raspberry Pi):
  A lightweight server running on a Raspberry Pi that provides a local network service accessible at wattchdog.local.
  It collects and displays data from measurement devices using the MQTT protocol.
  
  Web interface preview:
  
    <img width="1911" height="434" alt="light" src="https://github.com/user-attachments/assets/186bd056-38e2-4dce-9d1e-7747d2ef75c8" />

    <img width="1916" height="956" alt="startpage" src="https://github.com/user-attachments/assets/3376f2b6-ef11-497e-be55-7877e300b7b0" />

    <img width="1915" height="957" alt="Liveview" src="https://github.com/user-attachments/assets/24f2a6ea-2734-4ca9-9ced-d4d6129f149d" />

    <img width="1911" height="955" alt="config" src="https://github.com/user-attachments/assets/cd0f86e8-e688-4cd0-974a-f006afa3dad9" />

  MQTT tested via Postman:
  
    <img width="1383" height="867" alt="image" src="https://github.com/user-attachments/assets/2f175303-c937-4275-9f03-7e11dd0aa3cb" />


- Wattchdog Device (PCB, STM32 MCU):
  A physical IoT device equipped with a power measurement circuit and a Wi-Fi communication module,
  responsible for sending measurement data to the host service.
