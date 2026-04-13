# Interaction Diagram Generator

A high-performance mapping tool and web dashboard tailored for Civil & Structural Engineers to visually evaluate Nominal Axial Load ($K_n$) and Nominal Moment ($R_n$) structural capacities instantly. 

---

## Case Study (STAR Method)

### Situation
Structural and Civil Engineers frequently rely on non-linear **Interaction Diagrams** to evaluate the safe bounding capacities of reinforced concrete columns and shear walls. However, evaluating multiple load combinations manually on non-interactive charts is highly tedious and susceptible to human approximation errors—especially when cross-referencing dozens of unique ($R_n, K_n$) coordinates.

### Task
Deliver a robust, programmatic, and highly interactive software solution capable of parsing exact numerical limits and mapping them with pixel-perfect precision over static engineering capacity curves. The solution had to be accessible, bypass server configurations, handle large batch workloads, and maintain strict Civil Engineering UX aesthetics. 

### Action
We transitioned the core logic from a standalone Python script into a modern, client-side **React & Vite Web Application**, implementing:
*   **Coordinate Transformation Engine:** Developed custom affine transformation algorithms (`/src/lib/math.ts`) that reliably map vector data onto rasterized charts via HTML5 Canvas.
*   **Civil Engineering Aesthetic:** Enforced a strict, flat-surface design language emphasizing structural colors (Limestone, Mortar, Steel Blue) over modern drop-shadow templates.
*   **Batch CSV Automation:** Engineered an off-screen canvas rendering loop bridged with `jszip`. This allows users to blindly upload a `.csv` file with hundreds of load pairs, spinning up an invisible processing thread to render and bundle high-resolution `.png` analysis diagrams instantly.
*   **Configurable Rule Engine:** Built a live React configuration UI mapping to a structured JSON schema, giving users full semantic control over boundary logic, conditional limits, and marker calibration without touching code.

### Result
Engineers are now equipped with a powerful, zero-latency dashboard. They can manipulate sliders in real-time or drop in a massive spreadsheet to yield comprehensive structural analysis reports as a `.zip`. Because it is generated fully client-side on a static Vite framework, the application is inherently fast, secure, and easily deployable onto platforms like **Vercel** with zero server infrastructure costs.

---

## Quick Start & Deployment

### Local Development
```bash
# Navigate into the web application directory
cd web

# Install required dependencies (React, JSZip, Lucide Icons)
npm install

# Start the blazing fast Vite development server
npm run dev
```

### Deploying to Vercel
The `/web` folder houses the entire static React application and can be natively pushed to Vercel. 
1. Push your repository to **GitHub**.
2. Create a New Project on your **Vercel Dashboard**.
3. Under Framework Preset, ensure `Vite` is selected.
4. Set the **Root Directory** exactly to `web`.
5. Deploy!

---

## Feature Set
*   **Real-time Interaction:** Tweak $R_n$ and $K_n$ sliders to instantly update limits.
*   **Save & Export:** Effortless 1-click single-image downloads (`Rn-xxx_Kn-xxx.png`).
*   **Mass CSV Mode:** Batch generate evaluated diagrams simultaneously via CSV inputs.
*   **Modal Configuration Engine:** Programmatically change line colors, extensions, conditionals, and image origins in the browser without IDE access.
