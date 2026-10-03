#!/usr/bin/env node
/**
 * Khronos glTF-Validator & Gate G6 Asset Quality Assurance Suite.
 * Governing Document: docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6).
 *
 * Validates:
 * 1. Khronos glTF-Validator compliance: asserts 0 errors and 0 warnings.
 * 2. Deterministic SHA-256 and byte length consistency between GLB and manifest.
 * 3. Exact bounding envelope [width, height, depth] in meters and mm.
 * 4. Content-Addressed Storage (CAS) paths and canonical paths.
 * 5. Presence and validity of generated 3D preview thumbnails.
 *
 * Usage:
 *   NODE_PATH=b2b-backend/node_modules node scripts/validate-g6-assets.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const validator = require('gltf-validator');

const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_ASSETS_DIR = path.join(REPO_ROOT, 'docs', 'industrial', 'assets');
const STORAGE_ASSETS_DIR = path.join(REPO_ROOT, 'storage', 'industrial', 'assets');

const PILOT_SPECIFICATIONS = [
  {
    sku: 'CN-X5PRIME-HE-XP5',
    title: 'Horner Automation X5 Prime OCS',
    variantId: 'variant_01M41R18MQK0GXGPTYSX0EDZBH',
    snapshotId: 'snp_cn_x5prime_he_xp5_v1',
    assetId: 'ast_cn_x5prime_he_xp5_glb_v1',
    envelopeM: [0.120, 0.091, 0.060],
    dimensionsMm: { width: 120.0, height: 91.0, depth: 60.0 },
    bboxMin: [-0.060, 0.000, -0.045],
    bboxMax: [0.060, 0.091, 0.015],
    requiredAnchors: [
      'anchor_power_in',
      'anchor_rs485_mj1',
      'anchor_ethernet_lan',
      'anchor_analog_in',
      'anchor_digital_in',
      'anchor_digital_out',
      'anchor_display_center',
      'anchor_mounting_panel',
      'anchor_mounting_din'
    ]
  },
  {
    sku: 'CN-N1200',
    title: 'NOVUS N1200 Process PID Controller',
    variantId: 'variant_01M41R18XQ6QNWMX8Z39NMR2NW',
    snapshotId: 'snp_cn_n1200_v1',
    assetId: 'ast_cn_n1200_glb_v1',
    envelopeM: [0.048, 0.048, 0.110],
    dimensionsMm: { width: 48.0, height: 48.0, depth: 110.0 },
    bboxMin: [-0.024, 0.000, -0.100],
    bboxMax: [0.024, 0.048, 0.010],
    requiredAnchors: [
      'anchor_power_in',
      'anchor_universal_in',
      'anchor_out1_ctrl',
      'anchor_out2_alarm',
      'anchor_out3_alarm',
      'anchor_out4_analog',
      'anchor_usb_comm',
      'anchor_display_center',
      'anchor_mounting_panel'
    ]
  },
  {
    sku: 'CN-THT02',
    title: 'TZone THT-02 Environmental Transmitter',
    variantId: 'variant_01M41R193J5MPJ16MTX9CAWWRM',
    snapshotId: 'snp_cn_tht02_v1',
    assetId: 'ast_cn_tht02_glb_v1',
    envelopeM: [0.110, 0.085, 0.040],
    dimensionsMm: { width: 110.0, height: 85.0, depth: 40.0 },
    bboxMin: [-0.055, 0.000, -0.020],
    bboxMax: [0.055, 0.085, 0.020],
    requiredAnchors: [
      'anchor_sensor_internal',
      'anchor_power_in',
      'anchor_rs485',
      'anchor_mounting_wall'
    ]
  }
];

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function verifyApprox(val, expected, tolerance = 1e-4) {
  return Math.abs(val - expected) < tolerance;
}

async function validatePilotSku(spec) {
  const { sku, requiredAnchors } = spec;
  const results = {
    sku,
    title: spec.title,
    glbPath: path.join(DOCS_ASSETS_DIR, `${sku}.glb`),
    manifestPath: path.join(DOCS_ASSETS_DIR, `${sku}.manifest.json`),
    thumbnailPath: path.join(DOCS_ASSETS_DIR, 'thumbnails', `${sku}.png`),
    passed: true,
    failures: []
  };

  // 1. Verify GLB file exists
  if (!fs.existsSync(results.glbPath)) {
    results.passed = false;
    results.failures.push(`GLB file not found at: ${results.glbPath}`);
    return results;
  }
  const glbBytes = fs.readFileSync(results.glbPath);
  results.byteLength = glbBytes.length;
  results.sha256 = sha256Buffer(glbBytes);

  // 2. Run Khronos glTF-Validator
  try {
    const report = await validator.validateBytes(glbBytes, {
      validateAccessorData: true
    });
    results.numErrors = report.issues.numErrors;
    results.numWarnings = report.issues.numWarnings;
    results.numInfos = report.issues.numInfos;
    results.numHints = report.issues.numHints;

    if (report.issues.numErrors > 0) {
      results.passed = false;
      results.failures.push(`glTF-Validator reported ${report.issues.numErrors} error(s): ${JSON.stringify(report.issues.messages)}`);
    }
    if (report.issues.numWarnings > 0) {
      results.passed = false;
      results.failures.push(`glTF-Validator reported ${report.issues.numWarnings} warning(s): ${JSON.stringify(report.issues.messages)}`);
    }

    if (report.info) {
      results.vertexCount = report.info.totalVertexCount;
      results.triangleCount = report.info.totalTriangleCount;
      results.drawCallCount = report.info.drawCallCount;
      results.materialCount = report.info.materialCount;
    }
  } catch (err) {
    results.passed = false;
    results.failures.push(`glTF-Validator exception: ${err.message}`);
  }

  // 3. Verify Manifest File
  if (!fs.existsSync(results.manifestPath)) {
    results.passed = false;
    results.failures.push(`Manifest not found at: ${results.manifestPath}`);
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync(results.manifestPath, 'utf-8'));
      results.manifest = manifest;

      // Assertions on manifest
      if (manifest.schema_version !== 'model_manifest/2.0') {
        results.passed = false;
        results.failures.push(`Manifest schema_version '${manifest.schema_version}' !== 'model_manifest/2.0'`);
      }
      if (manifest.fidelity !== 'dimensional_proxy_verified') {
        results.passed = false;
        results.failures.push(`Manifest fidelity '${manifest.fidelity}' !== 'dimensional_proxy_verified'`);
      }
      if (manifest.sha256 !== results.sha256) {
        results.passed = false;
        results.failures.push(`Manifest SHA-256 '${manifest.sha256}' !== actual GLB '${results.sha256}'`);
      }
      if (manifest.byte_length !== results.byteLength) {
        results.passed = false;
        results.failures.push(`Manifest byte_length ${manifest.byte_length} !== actual ${results.byteLength}`);
      }

      // Check bounding box
      const bboxSize = manifest.bbox.size;
      for (let i = 0; i < 3; i++) {
        if (!verifyApprox(bboxSize[i], spec.envelopeM[i])) {
          results.passed = false;
          results.failures.push(`BBOX size[${i}] ${bboxSize[i]} != expected ${spec.envelopeM[i]}`);
        }
      }

      // Check anchors
      const anchorNames = new Set((manifest.anchors || []).map(a => a.name));
      for (const reqAnchor of requiredAnchors) {
        if (!anchorNames.has(reqAnchor)) {
          results.passed = false;
          results.failures.push(`Missing required anchor: '${reqAnchor}'`);
        }
      }
    } catch (err) {
      results.passed = false;
      results.failures.push(`Failed to parse manifest JSON: ${err.message}`);
    }
  }

  // 4. Verify Content-Addressed Storage (CAS) path in storage/
  const casGlbPath = path.join(STORAGE_ASSETS_DIR, results.sha256, `${sku}.glb`);
  const casManifestPath = path.join(STORAGE_ASSETS_DIR, results.sha256, `${sku}.manifest.json`);
  if (!fs.existsSync(casGlbPath)) {
    results.passed = false;
    results.failures.push(`CAS GLB missing at: ${casGlbPath}`);
  } else {
    const casBytes = fs.readFileSync(casGlbPath);
    if (sha256Buffer(casBytes) !== results.sha256) {
      results.passed = false;
      results.failures.push(`CAS GLB checksum mismatch at ${casGlbPath}`);
    }
  }
  if (!fs.existsSync(casManifestPath)) {
    results.passed = false;
    results.failures.push(`CAS Manifest missing at: ${casManifestPath}`);
  }

  // 5. Verify Canonical storage/ path
  const storageCanonicalGlb = path.join(STORAGE_ASSETS_DIR, `${sku}.glb`);
  if (!fs.existsSync(storageCanonicalGlb)) {
    results.passed = false;
    results.failures.push(`Storage canonical GLB missing at: ${storageCanonicalGlb}`);
  }

  // 6. Verify Thumbnail
  if (!fs.existsSync(results.thumbnailPath)) {
    results.passed = false;
    results.failures.push(`Thumbnail missing at: ${results.thumbnailPath}`);
  } else {
    const thumbStats = fs.statSync(results.thumbnailPath);
    if (thumbStats.size < 1000) {
      results.passed = false;
      results.failures.push(`Thumbnail suspiciously small (${thumbStats.size} bytes)`);
    }
  }

  return results;
}

async function main() {
  console.log('='.repeat(80));
  console.log('KHRONOS glTF-VALIDATOR & GATE G6 ASSET QA SUITE');
  console.log('Governing Document: docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6)');
  console.log('='.repeat(80));

  let allPassed = true;
  const summary = [];

  for (const spec of PILOT_SPECIFICATIONS) {
    console.log(`\nValidating SKU: ${spec.sku} (${spec.title})...`);
    const res = await validatePilotSku(spec);
    summary.push(res);

    if (res.passed) {
      console.log(`  ✓ Khronos glTF-Validator: 0 errors, 0 warnings (100% compliant)`);
      console.log(`  ✓ SHA-256:                ${res.sha256}`);
      console.log(`  ✓ Byte Length:            ${res.byteLength.toLocaleString()} bytes`);
      console.log(`  ✓ Geometry:               ${res.vertexCount} vertices, ${res.triangleCount} triangles, ${res.materialCount} materials`);
      console.log(`  ✓ Envelope (m):           [${spec.envelopeM.join(', ')}]`);
      console.log(`  ✓ Anchors (Verified):     ${spec.requiredAnchors.length}/${spec.requiredAnchors.length}`);
      console.log(`  ✓ Content-Addressed Path: storage/industrial/assets/${res.sha256}/${spec.sku}.glb`);
      console.log(`  ✓ Thumbnail (PNG):        docs/industrial/assets/thumbnails/${spec.sku}.png`);
    } else {
      allPassed = false;
      console.error(`  ✗ VALIDATION FAILED for ${spec.sku}:`);
      for (const f of res.failures) {
        console.error(`      • ${f}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY OF GATE G6 ASSET VALIDATION');
  console.log('='.repeat(80));
  console.log(
    'SKU'.padEnd(22) +
    'Status'.padEnd(10) +
    'Errors'.padEnd(10) +
    'Warnings'.padEnd(10) +
    'Vertices'.padEnd(10) +
    'Triangles'.padEnd(12) +
    'Size'
  );
  console.log('-'.repeat(80));

  for (const s of summary) {
    const statusStr = s.passed ? 'PASS' : 'FAIL';
    const errStr = (s.numErrors !== undefined ? s.numErrors : 'N/A').toString();
    const warnStr = (s.numWarnings !== undefined ? s.numWarnings : 'N/A').toString();
    const vStr = (s.vertexCount || 0).toString();
    const tStr = (s.triangleCount || 0).toString();
    const bytesStr = `${((s.byteLength || 0) / 1024).toFixed(1)} KB`;

    console.log(
      s.sku.padEnd(22) +
      statusStr.padEnd(10) +
      errStr.padEnd(10) +
      warnStr.padEnd(10) +
      vStr.padEnd(10) +
      tStr.padEnd(12) +
      bytesStr
    );
  }
  console.log('='.repeat(80));

  if (!allPassed) {
    console.error('\nFAIL: One or more Gate G6 assets failed quality assurance.');
    process.exit(1);
  }

  console.log('\nSUCCESS: All Gate G6 3D assets passed 100% Khronos and dimensional verification with 0 errors and 0 warnings.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
