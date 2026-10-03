# Muse client prompt — plant problem → integrated solution

**Purpose:** Demo Meta Muse against the live Controlnautas Industrial API without framing the user as a shopper comparing SKUs.

**Doctrine:** The client arrives with a **production-line problem**. Muse designs a **solution from catalog products**, shows **installation on the line**, renders **integrated 3D at real scale**, and only then quotes **sellable** items. Missing circuit roles stay explicit — never invented.

**Edge:** `https://data.controlnautas.com`  
**OpenAPI:** `https://data.controlnautas.com/docs/openapi-industrial-v2-demo.yaml`  
**Pilot catalog SKUs:** `CN-X5PRIME-HE-XP5` · `CN-N1200` · `CN-THT02`  
**Honest missing roles:** SSR / power switching · electric heater / thermal load

---

## Primary prompt (paste into Muse)

```text
I don’t want a product comparison. I have a production problem and need a solution.

Our line dries coffee beans on a conveyor. I need to keep the drying air / product
temperature under control so the beans don’t overdry or stay wet. I want a closed-loop
system: measure temperature and humidity in the drying zone, run PID control, and drive
an electric heater / resistance load so the process stays on setpoint while the belt
is running.

Please act as my industrial applications engineer using the Controlnautas API at
https://data.controlnautas.com as the only source of truth
(OpenAPI: https://data.controlnautas.com/docs/openapi-industrial-v2-demo.yaml):

1) Start from my process need (coffee drying on a conveyor), not from a shopping list.
2) Propose a working solution using the real products you sell that fit this loop —
   especially a process PID controller, the TZone temperature/humidity transmitter,
   and supervisory HMI/PLC if useful — and explain how they are installed on the line
   (sensor placement over the belt / chamber, panel, heater power stage, control wiring,
   Modbus/RS-485 if used).
3) Be honest: if a power interface (SSR/contactor) or heater SKU is missing from the
   live catalog, mark it as a missing role — do not invent fake part numbers. Still
   show how the complete loop should look.
4) Build an interactive 3D scene of the SOLUTION IN THE FACTORY — not just floating
   product cards. I want to see the equipment integrated on a drying line / conveyor
   context, in real scale (meters), with the catalog GLB models for the real products,
   and clearly labeled placeholders only for missing roles.
5) Show the system “alive”: PV/SP, PID / OUT behavior conceptually for the drying
   process, and how the operator would see it in the plant.
6) Then give live price + stock only for the real catalog items in the proposal, and
   a preliminary multiline USD quote PDF for those catalog items.

Do not ask me to pick random SKUs first. Design the solution for my coffee drying
conveyor problem, visualize it integrated in 3D at real scale, then quote what is
actually sellable today from Controlnautas.
```

---

## Short variant

```text
I have a coffee-bean drying conveyor and need a plant solution, not a product catalog
tour. Design a closed-loop control system (temp/RH sensing + PID + heater drive +
optional supervisory HMI) using Controlnautas live data at
https://data.controlnautas.com. Show it in 3D as installed on the production line at
real scale, using official product models only; mark missing SSR/heater roles honestly.
Then give live price/stock and a preliminary quote PDF for the real catalog items.
```

---

## What success looks like

| Layer | Expected Muse behavior |
|---|---|
| Intent | Process / line problem first |
| Engineering | Catalog roles mapped to the drying loop |
| Honesty | `missing_roles` for SSR / heater if not in catalog |
| 3D | Integrated plant scene at meters scale — not SKU cards alone |
| Live ops | Conceptual PV/SP / PID OUT for the drying process |
| Commerce | Live Medusa price/stock + preliminary quote PDF for catalog lines only |
