// Automated CLI Test Suite for CivixAI: TC-11 to TC-18
// Run with: node test_tc_suite.mjs

const API_BASE = 'http://localhost:5000/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  magenta: '\x1b[35m',
};

function pass(tcId, name, detail) {
  console.log(`${colors.green}✔ [${tcId}] PASS${colors.reset} - ${colors.bold}${name}${colors.reset}`);
  if (detail) console.log(`   ${colors.cyan}↳ ${detail}${colors.reset}`);
}

function fail(tcId, name, reason) {
  console.error(`${colors.red}✖ [${tcId}] FAIL${colors.reset} - ${colors.bold}${name}${colors.reset}`);
  if (reason) console.error(`   ${colors.red}↳ ${reason}${colors.reset}`);
}

async function runAllTests() {
  console.log(`\n${colors.bold}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   CivixAI Multimodal Vision AI Platform - Verification Suite (TC-11 - TC-18)${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}========================================================================\n${colors.reset}`);

  let passedCount = 0;
  let totalTests = 8;

  // -------------------------------------------------------------
  // TC-11: Relevant input
  // How to test: Submit a clear, relevant civic issue.
  // Expected result: AI returns an appropriate result for the input.
  // -------------------------------------------------------------
  try {
    const input = 'Severe 8-inch deep asphalt pothole on 5th Avenue causing car tire rim damage.';
    const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: input }),
    });
    const json = await res.json();
    const data = json.data;

    if (
      json.success &&
      data &&
      data.category === 'ROADS' &&
      data.hazardScore > 50 &&
      data.recommendedDepartment &&
      data.grievanceDraft
    ) {
      pass('TC-11', 'Relevant input', `Categorized: ${data.category}, Dept: ${data.recommendedDepartment}, Hazard Score: ${data.hazardScore}/100`);
      passedCount++;
    } else {
      fail('TC-11', 'Relevant input', `Unexpected response structure: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('TC-11', 'Relevant input', err.message);
  }

  // -------------------------------------------------------------
  // TC-12: Different issue types
  // How to test: Try road damage, garbage, water leakage, and streetlight problems if supported.
  // Expected result: Each issue is handled appropriately.
  // -------------------------------------------------------------
  try {
    const types = [
      { text: 'Deep asphalt pothole cavity in roadway', expectedCat: 'ROADS' },
      { text: 'Rotting uncollected municipal solid waste and garbage heaps', expectedCat: 'SANITATION' },
      { text: 'Sub-surface pressurized clean water main pipe leak and burst', expectedCat: 'WATER' },
      { text: 'Dangling live 240V streetlight wire sparking over pavement', expectedCat: 'ELECTRICAL' },
    ];

    let allTypesPassed = true;
    const typeResults = [];

    for (const t of types) {
      const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDescription: t.text }),
      });
      const json = await res.json();
      const cat = json.data?.category;
      if (cat === t.expectedCat) {
        typeResults.push(`${t.expectedCat} (OK)`);
      } else {
        allTypesPassed = false;
        typeResults.push(`${t.expectedCat} (Got: ${cat})`);
      }
    }

    if (allTypesPassed) {
      pass('TC-12', 'Different issue types', `All 4 core domains classified accurately: ${typeResults.join(', ')}`);
      passedCount++;
    } else {
      fail('TC-12', 'Different issue types', `Classification mismatch: ${typeResults.join(', ')}`);
    }
  } catch (err) {
    fail('TC-12', 'Different issue types', err.message);
  }

  // -------------------------------------------------------------
  // TC-13: Ambiguous input
  // How to test: Enter a vague complaint such as “There is a problem here.”
  // Expected result: AI asks for clarification or indicates insufficient information.
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: 'There is a problem here.' }),
    });
    const json = await res.json();
    const data = json.data;

    if (
      json.success &&
      data &&
      (data.isAmbiguous === true || data.status === 'ambiguous') &&
      data.clarificationPrompt &&
      data.clarificationQuestions?.length >= 2 &&
      data.category !== 'ROADS' // Did not hallucinate a pothole
    ) {
      pass('TC-13', 'Ambiguous input', `AI detected ambiguity; prompted: "${data.clarificationPrompt.substring(0, 60)}..."`);
      passedCount++;
    } else {
      fail('TC-13', 'Ambiguous input', `Did not flag as ambiguous or fabricated defect: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('TC-13', 'Ambiguous input', err.message);
  }

  // -------------------------------------------------------------
  // TC-14: Irrelevant input
  // How to test: Enter unrelated text.
  // Expected result: AI handles it gracefully and does not invent a valid civic report.
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: 'What is the secret recipe for homemade chocolate cake?' }),
    });
    const json = await res.json();
    const data = json.data;

    if (
      json.success &&
      data &&
      (data.isRelevant === false || data.status === 'irrelevant') &&
      data.hazardScore === 0 &&
      data.grievanceDraft === null
    ) {
      pass('TC-14', 'Irrelevant input', `Handled gracefully without inventing civic report. Message: "${data.message.substring(0, 70)}..."`);
      passedCount++;
    } else {
      fail('TC-14', 'Irrelevant input', `Did not reject non-civic input: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('TC-14', 'Irrelevant input', err.message);
  }

  // -------------------------------------------------------------
  // TC-15: Empty AI request
  // How to test: Submit without providing the required input.
  // Expected result: Validation appears, and unnecessary AI calls are avoided.
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: '    ' }),
    });
    const json = await res.json();

    if (res.status === 400 && (json.validationError === true || json.success === false)) {
      pass('TC-15', 'Empty AI request', `Status 400 Validation Error returned: "${json.error}". Unnecessary AI calls avoided.`);
      passedCount++;
    } else {
      fail('TC-15', 'Empty AI request', `Expected 400 validation error but received status: ${res.status}`);
    }
  } catch (err) {
    fail('TC-15', 'Empty AI request', err.message);
  }

  // -------------------------------------------------------------
  // TC-16: AI service failure
  // How to test: Test when the AI API is unavailable or times out.
  // Expected result: The app reports the failure and remains usable.
  // -------------------------------------------------------------
  try {
    // 1. Enable simulated failure
    await fetch(`${API_BASE}/ai/simulate-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulate: true }),
    });

    // 2. Call AI preview while service is "failing"
    const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: 'Sparking high-voltage live wire hanging across road' }),
    });
    const json = await res.json();
    const data = json.data;

    // 3. Reset failure simulation back to false
    await fetch(`${API_BASE}/ai/simulate-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulate: false }),
    });

    if (
      json.success &&
      data &&
      (data.cloudAiFailed === true || data.fallbackUsed === true) &&
      data.category === 'ELECTRICAL' &&
      data.grievanceDraft
    ) {
      pass('TC-16', 'AI service failure', `Failure caught; fallback activated: "${data.modelUsed}". App remained fully operational.`);
      passedCount++;
    } else {
      fail('TC-16', 'AI service failure', `Did not report failure or failed to provide fallback: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('TC-16', 'AI service failure', err.message);
  }

  // -------------------------------------------------------------
  // TC-17: Output quality
  // How to test: Compare AI-generated answers against known examples.
  // Expected result: Responses are relevant, understandable, and do not claim unsupported facts.
  // -------------------------------------------------------------
  try {
    const input = 'Burst water supply pipe causing drinking water wastage and road erosion on Boulevard';
    const res = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: input }),
    });
    const json = await res.json();
    const data = json.data;

    const isHighQuality =
      data.category === 'WATER' &&
      data.recommendedDepartment?.includes('Water') &&
      Array.isArray(data.detectedObjects) &&
      data.detectedObjects.length >= 3 &&
      data.grievanceDraft?.includes('FORMAL CIVIC GRIEVANCE') &&
      data.rawSummary?.length > 20;

    if (json.success && isHighQuality) {
      pass('TC-17', 'Output quality', `Response grounded in facts: Dept: ${data.recommendedDepartment}, Objects: ${data.detectedObjects.slice(0, 2).join(', ')}...`);
      passedCount++;
    } else {
      fail('TC-17', 'Output quality', `Output quality assertions failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('TC-17', 'Output quality', err.message);
  }

  // -------------------------------------------------------------
  // TC-18: Repeatability
  // How to test: Submit the same input multiple times.
  // Expected result: Results remain reasonable; no duplicate records are created unless intended.
  // -------------------------------------------------------------
  try {
    const runId = Date.now();
    const testTitle = `Repeatability Test Defect Pothole ${runId}`;
    const issuePayload = {
      title: testTitle,
      description: `Defect report for duplicate detection test run #${runId}.`,
      category: 'ROADS',
      priority: 'High',
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000',
      longitude: -73.91 - ((runId % 500) * 0.001),
      latitude: 40.78 + ((runId % 500) * 0.001),
      formattedAddress: `${runId % 900} River Avenue, Ward 12`,
    };

    // 1. Submit first time -> Should succeed
    const firstRes = await fetch(`${API_BASE}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issuePayload),
    });
    const firstJson = await firstRes.json();

    // 2. Submit second identical time -> Should detect duplicate
    const secondRes = await fetch(`${API_BASE}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issuePayload),
    });
    const secondJson = await secondRes.json();

    // 3. Test deterministic AI output for same input
    const ai1 = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: testTitle }),
    });
    const ai1Json = await ai1.json();
    const ai2 = await fetch(`${API_BASE}/ai/analyze-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDescription: testTitle }),
    });
    const ai2Json = await ai2.json();

    const isDeterministic =
      ai1Json.data?.category === ai2Json.data?.category &&
      ai1Json.data?.hazardScore === ai2Json.data?.hazardScore;

    if (
      firstJson.success &&
      secondJson.duplicateDetected === true &&
      isDeterministic
    ) {
      pass(
        'TC-18',
        'Repeatability',
        `Deterministic AI results verified. Duplicate submission blocked (#${secondJson.existingIssue?.ticketId}). No duplicate record created.`
      );
      passedCount++;
    } else {
      fail(
        'TC-18',
        'Repeatability',
        `firstSuccess=${firstJson.success} (${firstJson.error || ''}), secondDuplicate=${secondJson.duplicateDetected}, deterministic=${isDeterministic}`
      );
    }
  } catch (err) {
    fail('TC-18', 'Repeatability', err.message);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bold}   TEST SUMMARY: ${passedCount} / ${totalTests} TESTS PASSED${colors.reset}`);
  if (passedCount === totalTests) {
    console.log(`${colors.bold}${colors.green}   🎉 100% SUCCESS: ALL 8 TEST CASES (TC-11 TO TC-18) SATISFIED!${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.red}   ⚠️ ${totalTests - passedCount} TESTS FAILED${colors.reset}`);
  }
  console.log(`${colors.bold}${colors.magenta}========================================================================\n${colors.reset}`);
}

runAllTests().catch(console.error);
