import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Industrial Solution Studio — Controlnautas Pilot",
  description:
    "Deterministic 3D Digital Twin & Agentic B2B Commerce for Industrial Automation. Meta Muse connector integration, verified 3D assets, and automated engineering evaluation.",
}

const PILOT_DEVICES = [
  {
    sku: "CN-X5PRIME-HE-XP5",
    brand: "Horner Automation",
    model: "X5 Prime OCS (HE-XP5)",
    role: "Supervisory PLC & Touch Operator Interface",
    envelopeMm: "120 × 91 × 60 mm",
    envelopeM: "0.120 × 0.091 × 0.060 m",
    fidelity: "dimensional_proxy_verified",
    weight: "340 g",
    mounting: "Panel mount (1/4 DIN bezel) / DIN rail adapter",
    ports: "10-30 VDC Power, RS-485 Modbus RTU/ASCII (MJ1), 10/100 Ethernet, 4 DI, 4 DO, 4 AI",
    glbUrl:
      "https://data.controlnautas.com/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb",
    imageSrc: "/images/industrial/CN-X5PRIME-HE-XP5.png",
    productHandle: "cn-x5prime-he-xp5",
    sha256: "47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5",
    fileSize: "27.3 KB",
    triangles: 336,
  },
  {
    sku: "CN-N1200",
    brand: "NOVUS Automation",
    model: "N1200 Universal Process PID Controller",
    role: "Precision Temperature & Process Controller",
    envelopeMm: "48 × 48 × 110 mm",
    envelopeM: "0.048 × 0.048 × 0.110 m",
    fidelity: "dimensional_proxy_verified",
    weight: "250 g",
    mounting: "1/16 DIN panel cutout (45 × 45 mm)",
    ports: "100-240 VAC/DC Power, Universal Input (Pt100/TC/4-20mA), OUT1 SSR Pulse, OUT2/3 Relay, OUT4 4-20mA Retransmission, RS-485 Modbus RTU Slave, Front USB Mini-B",
    glbUrl:
      "https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb",
    imageSrc: "/images/industrial/CN-N1200.png",
    productHandle: "cn-n1200",
    sha256: "73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2",
    fileSize: "31.4 KB",
    triangles: 408,
  },
  {
    sku: "CN-THT02",
    brand: "TZone Digital",
    model: "THT-02 Industrial Temp/RH Transmitter",
    role: "Process & Chamber Ambient Telemetry Probe",
    envelopeMm: "110 × 85 × 40 mm",
    envelopeM: "0.110 × 0.085 × 0.040 m",
    fidelity: "dimensional_proxy_verified",
    weight: "180 g",
    mounting: "Wall-mount flanged enclosure (IP65 housing, porous sensor cap)",
    ports: "5-24 VDC Power, RS-485 Modbus RTU Slave (9600-115200 bps, 8-N-1), Internal Sensirion SHT30 (-40..+85 °C, 0..100% RH)",
    glbUrl:
      "https://data.controlnautas.com/industrial-assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb",
    imageSrc: "/images/industrial/CN-THT02.png",
    productHandle: "cn-tht02",
    sha256: "7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327",
    fileSize: "15.4 KB",
    triangles: 156,
  },
]

export default function SolutionStudioPage() {
  return (
    <div className="w-full bg-[#0B0F17] text-slate-100 min-h-screen">
      {/* Background radial highlight */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-[#111928] via-[#0B0F17] to-[#0B0F17]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 relative z-10">
          {/* Breadcrumb */}
          <nav className="text-xs text-slate-400 mb-6 flex items-center gap-2">
            <LocalizedClientLink href="/" className="hover:text-blue-400 transition-colors">
              Home
            </LocalizedClientLink>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 font-semibold">Solution Studio</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">Heating Chamber Pilot</span>
          </nav>

          {/* Badge & Title */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Meta Muse API v2 Active • Sprint DEMO P0
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Industrial Solution Studio: Heating Chamber Pilot
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-4xl font-light leading-relaxed mb-8">
            Deterministic 3D Digital Twin & Agentic B2B Commerce for Industrial Automation.
            Engineered to empower AI spatial agents with verified manufacturer physical evidence,
            closed tri-state rule evaluation, and immutable multiline quotation.
          </p>

          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-mono uppercase text-slate-400">Target Process</div>
              <div className="text-base font-bold text-white mt-1">Heating Chamber</div>
              <div className="text-xs text-slate-500 mt-0.5">Lumped thermal loop</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-mono uppercase text-slate-400">Evaluator Engine</div>
              <div className="text-base font-bold text-emerald-400 mt-1">Gate G5 Deterministic</div>
              <div className="text-xs text-slate-500 mt-0.5">Tri-state • Zero hallucinations</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-mono uppercase text-slate-400">3D Dimensional Fidelity</div>
              <div className="text-base font-bold text-blue-400 mt-1">0.0 mm Delta</div>
              <div className="text-xs text-slate-500 mt-0.5">Khronos glTF 2.0 verified</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
              <div className="text-xs font-mono uppercase text-slate-400">B2B Commerce</div>
              <div className="text-base font-bold text-purple-400 mt-1">Medusa 2 USD</div>
              <div className="text-xs text-slate-500 mt-0.5">BOM Quote + Signed PDF</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* SECTION 1: META MUSE AGENT CONNECTOR QUICKSTART */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 md:p-8 backdrop-blur shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono uppercase text-blue-400 tracking-wider">
                Agentic Integration Interface
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                Meta Muse Agent Connector Quickstart
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://data.controlnautas.com/docs/openapi-industrial-v2-demo.yaml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-medium rounded-lg transition-colors"
              >
                <span>Download OpenAPI Spec (.yaml)</span>
                <span className="text-blue-200">↗</span>
              </a>
            </div>
          </div>

          {/* Connection Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 font-mono">
              <div className="text-xs text-slate-500 uppercase">Public Edge Endpoint</div>
              <div className="text-sm font-semibold text-emerald-400 mt-1 break-all">
                https://data.controlnautas.com
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Let&apos;s Encrypt TLS 1.3 • Nginx Proxy</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 font-mono">
              <div className="text-xs text-slate-500 uppercase">Authentication Mode</div>
              <div className="text-sm font-semibold text-amber-400 mt-1">
                Bearer Token (<code className="text-xs">MUSE_API_TOKEN</code>)
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Read-only agent scope</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 font-mono">
              <div className="text-xs text-slate-500 uppercase">OpenAPI Contract</div>
              <div className="text-sm font-semibold text-blue-400 mt-1 break-all">
                /docs/openapi-industrial-v2-demo.yaml
              </div>
              <div className="text-[11px] text-slate-500 mt-1">OAS 3.1.0 • Validated JSON Schema</div>
            </div>
          </div>

          {/* Supported Endpoints Table */}
          <div className="mt-6">
            <div className="text-xs font-mono uppercase text-slate-400 mb-3">
              Official v2 & Commerce Endpoints for Agent Tool Calling
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Method</th>
                    <th className="py-2.5 px-4 font-semibold">Path</th>
                    <th className="py-2.5 px-4 font-semibold">Gate</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-4 text-white">/api/industrial/v2/capabilities</td>
                    <td className="py-2.5 px-4 text-slate-400">G7</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      Discovers platform features, units, rule sets, and active process families.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-4 text-white">/api/industrial/v2/products/search?q=&#123;query&#125;</td>
                    <td className="py-2.5 px-4 text-slate-400">G7</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      Parametric technical search over verified snapshots (e.g. <code className="text-blue-300">?q=novus</code>).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-4 text-white">/api/industrial/v2/products/&#123;sku&#125;</td>
                    <td className="py-2.5 px-4 text-slate-400">G7</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      Complete verified datasheet facts, ports, electrical ratings, and evidence anchors.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-4 text-white">/api/industrial/v2/products/&#123;sku&#125;/model3d</td>
                    <td className="py-2.5 px-4 text-slate-400">G7</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      Returns direct GLB URL, SHA-256 digest, bounding box in meters, and PortSchema anchors.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">GET</td>
                    <td className="py-2.5 px-4 text-white">/api/industrial/v2/configurations/heating-chamber/bundle</td>
                    <td className="py-2.5 px-4 text-slate-400">G8</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      Unified engineering bundle: components, spatial placements, evaluation, and asset delivery links.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-blue-400 font-bold">POST</td>
                    <td className="py-2.5 px-4 text-white">/api/muse/v1/preliminary-quotes</td>
                    <td className="py-2.5 px-4 text-slate-400">G9</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      Creates instant immutable multiline BOM quotation in USD with official signed PDF generation.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quickstart Curl Snippet */}
          <div className="mt-6 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span>BASH QUICKSTART • PROD HTTPS</span>
              <span className="text-[10px]">CURL 8.x COMPATIBLE</span>
            </div>
            <pre className="overflow-x-auto text-emerald-400">
              <code>{`# 1. Inspect agent capabilities
curl -s https://data.controlnautas.com/api/industrial/v2/capabilities

# 2. Search verified industrial catalog
curl -s "https://data.controlnautas.com/api/industrial/v2/products/search?q=novus"

# 3. Fetch unified Heating Chamber 3D bundle
curl -s https://data.controlnautas.com/api/industrial/v2/configurations/heating-chamber/bundle

# 4. Generate instantaneous B2B BOM quotation
curl -s -X POST https://data.controlnautas.com/api/muse/v1/preliminary-quotes \\
  -H "Content-Type: application/json" \\
  -d '{"items": [{"sku": "CN-N1200", "quantity": 1}, {"sku": "CN-THT02", "quantity": 1}]}'`}</code>
            </pre>
          </div>
        </section>

        {/* SECTION 2: PILOT DEVICES & 3D DIGITAL TWINS */}
        <section>
          <div className="mb-8">
            <div className="text-xs font-mono uppercase text-blue-400 tracking-wider">
              Gate G6 Authoritative 3D Assets
            </div>
            <h2 className="text-3xl font-bold text-white mt-1">
              Pilot Devices & Verified 3D Digital Twins
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl">
              Each asset is mathematically normalized in meters (+Y up, +Z front) with zero external textures,
              pure binary glTF 2.0 formatting, and 1:1 PortSchema anchor mapping. Validated with Khronos glTF-Validator (0 errors, 0 warnings).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {PILOT_DEVICES.map((dev) => (
              <div
                key={dev.sku}
                className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-800 bg-slate-950/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {dev.brand}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {dev.fidelity}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug">{dev.model}</h3>
                    <div className="text-xs font-mono text-slate-400 mt-1">SKU: {dev.sku}</div>
                    <div className="text-xs text-blue-300 mt-0.5">{dev.role}</div>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="relative h-48 w-full bg-slate-950 border-b border-slate-800 flex items-center justify-center p-4">
                    <Image
                      src={dev.imageSrc}
                      alt={dev.model}
                      width={300}
                      height={180}
                      className="max-h-40 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-400">
                      {dev.fileSize} • {dev.triangles} tris
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="p-6 space-y-3 text-xs">
                    <div>
                      <div className="text-slate-500 uppercase font-mono text-[10px]">Verified Bounding Box (0.0mm Delta)</div>
                      <div className="text-white font-mono font-semibold mt-0.5">{dev.envelopeMm}</div>
                      <div className="text-[11px] text-slate-400 font-mono">meters: {dev.envelopeM}</div>
                    </div>

                    <div>
                      <div className="text-slate-500 uppercase font-mono text-[10px]">Mounting & Mechanics</div>
                      <div className="text-slate-300 mt-0.5">{dev.mounting}</div>
                    </div>

                    <div>
                      <div className="text-slate-500 uppercase font-mono text-[10px]">Topological Ports & Signals</div>
                      <div className="text-slate-300 mt-0.5 leading-relaxed">{dev.ports}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Links */}
                <div className="p-6 pt-0 space-y-2">
                  <a
                    href={dev.glbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-medium rounded-lg transition-colors"
                  >
                    <span>Download Production GLB (3D)</span>
                    <span>↓</span>
                  </a>

                  <LocalizedClientLink
                    href={`/products/${dev.productHandle}`}
                    className="w-full inline-flex items-center justify-center gap-1 px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono rounded-lg transition-colors border border-slate-700/60"
                  >
                    <span>View in Store Catalog</span>
                    <span>→</span>
                  </LocalizedClientLink>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: ARCHITECTURAL SAFETY (GATE G5 EVALUATOR) */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-950/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium mb-3">
              Deterministic Safety Core • Gate G5
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Architectural Safety: Why Zero Hallucinations Matter
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Industrial automation deals with high voltages, thermal dynamics, and life-critical operations.
              Unlike probabilistic large language models that guess compatibility, the Controlnautas
              evaluator executes strict closed-world deterministic rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-5">
              <div className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                meets
              </div>
              <div className="text-sm font-semibold text-white mt-2">Explicitly Verified</div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Requirement is fully proven by manufacturer datasheet evidence (page &gt;= 1, literal excerpt)
                and valid physical signal interfaces.
              </p>
            </div>

            <div className="bg-slate-950 border border-red-500/30 rounded-lg p-5">
              <div className="text-xs font-mono uppercase text-red-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                does_not_meet
              </div>
              <div className="text-sm font-semibold text-white mt-2">Physical Incompatibility</div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Physical conflict detected: voltage mismatches (120 VAC vs 24 VDC), signal direction reversals,
                or an incomplete control loop.
              </p>
            </div>

            <div className="bg-slate-950 border border-amber-500/30 rounded-lg p-5">
              <div className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                not_documented
              </div>
              <div className="text-sm font-semibold text-white mt-2">Strict Fail-Safe</div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                If a property is missing or ambiguous, it NEVER resolves to approval. The platform prompts for
                field verification rather than guessing.
              </p>
            </div>
          </div>

          {/* Safety Highlight Box: Incomplete Loop Rejection */}
          <div className="bg-red-950/20 border border-red-500/40 rounded-lg p-5 md:p-6 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-mono font-bold text-red-400 text-sm mb-2">
              <span>⚠</span>
              <span>HEATING CHAMBER PILOT SAFETY CASE: Incomplete Control Loop Safe Rejection</span>
            </div>
            <p className="leading-relaxed mb-3">
              In a thermal heating chamber, an instrumentation engineer requires a closed loop consisting of:
              <strong> (1) Sensor</strong>, <strong>(2) Controller</strong>, <strong>(3) Power Actuator (SSR)</strong>,
              and <strong>(4) Heating Element</strong>.
            </p>
            <p className="leading-relaxed text-slate-400">
              When an operator configures only the Horner PLC (<code className="text-slate-200">CN-X5PRIME-HE-XP5</code>),
              NOVUS PID controller (<code className="text-slate-200">CN-N1200</code>), and TZone probe (<code className="text-slate-200">CN-THT02</code>),
              standard AI agents might erroneously declare the configuration ready. The Controlnautas Evaluator correctly evaluates rule{" "}
              <code className="text-red-300 font-mono">CONTROL_LOOP_COMPLETENESS</code> as{" "}
              <span className="font-bold text-red-400 font-mono">does_not_meet</span> (reason:{" "}
              <code className="text-red-300 font-mono">MISSING_POWER_ACTUATOR_AND_HEATER</code>).
              This safely halts false positive procurement before hardware is ordered or connected.
            </p>
          </div>
        </section>

        {/* SECTION 4: INSTANT PRELIMINARY QUOTATION */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 md:p-8 backdrop-blur shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono uppercase text-purple-400 tracking-wider">
                Automated B2B Commerce • Gate G9
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                Instant Preliminary Quotation
              </h2>
            </div>
            <div>
              <a
                href="https://data.controlnautas.com/api/muse/v1/preliminary-quotes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-medium rounded-lg transition-colors"
              >
                <span>Call Preliminary Quotes API</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-6">
            <div>
              <h4 className="text-sm font-bold text-white mb-2">
                Programmatic Multiline BOM Quoting
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Meta Muse agents and automated procurement workflows can price arbitrary Bills of Materials (BOM)
                in real time. The endpoint computes USD major/minor currency amounts from authoritative Medusa 2 price
                lists, creates an immutable quote record, and compiles a signed PDF using the native ReportLab engine.
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">
                    <strong>Zero Client-Side Math:</strong> Minor unit integer cents prevent floating-point rounding errors.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">
                    <strong>Immutable Job Correlation:</strong> Every quote receives a unique <code className="text-slate-200">job_id</code> and expiration timestamp.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300">
                    <strong>Automated PDF Delivery:</strong> Instant downloadable engineering spec sheet and quote PDF over HTTPS.
                  </span>
                </div>
              </div>
            </div>

            {/* Code Demo */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs">
              <div className="text-slate-500 text-[11px] mb-2 uppercase">Example Quote Request Payload</div>
              <pre className="text-blue-300 overflow-x-auto mb-4">
                <code>{`POST /api/muse/v1/preliminary-quotes HTTP/1.1
Host: data.controlnautas.com
Content-Type: application/json

{
  "items": [
    { "sku": "CN-X5PRIME-HE-XP5", "quantity": 1 },
    { "sku": "CN-N1200", "quantity": 1 },
    { "sku": "CN-THT02", "quantity": 1 }
  ],
  "customer": {
    "company": "Industrial Pilot Lab",
    "email": "engineer@pilot.org"
  }
}`}</code>
              </pre>

              <div className="text-slate-500 text-[11px] mb-2 uppercase">Response Highlights</div>
              <pre className="text-emerald-400 overflow-x-auto">
                <code>{`{
  "quote_id": "qte_01JK8M7PZ...",
  "status": "preliminary",
  "currency": "USD",
  "subtotal": 1285.00,
  "pdf_download_url": "https://data.controlnautas.com/api/muse/v1/quotes/qte_01JK8M7PZ/pdf"
}`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
