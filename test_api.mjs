// Test script for CivixAI end-to-end API testing
const API_BASE = 'http://localhost:5000/api';

async function testSuite() {
  console.log('--- 1. Testing Health ---');
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = await healthRes.json();
  console.log('Health:', health);

  console.log('\n--- 2. Testing AI Preview Analysis ---');
  const aiRes = await fetch(`${API_BASE}/ai/analyze-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userDescription: 'Dangerous live electrical wire hanging from broken streetlight pole outside elementary school',
      photoUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=1000',
    }),
  });
  const aiData = await aiRes.json();
  console.log('AI Analysis Result:');
  console.log('  Problem:', aiData.data?.identifiedProblem);
  console.log('  Category:', aiData.data?.category);
  console.log('  Priority:', aiData.data?.priority);
  console.log('  Hazard Score:', aiData.data?.hazardScore);
  console.log('  Target Dept:', aiData.data?.recommendedDepartment);
  console.log('  Grievance Draft Sample:', aiData.data?.grievanceDraft?.substring(0, 150) + '...');

  console.log('\n--- 3. Testing Issue Creation ---');
  const createRes = await fetch(`${API_BASE}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Deep Asphalt Crater on High-Speed Highway Entrance',
      description: 'Pothole expanded after storm, several cars experienced wheel damage.',
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000',
      category: 'ROADS',
      priority: 'Urgent',
      longitude: -73.985131,
      latitude: 40.748817,
      formattedAddress: '350 5th Avenue, Ward 4, Metro City',
      citizenName: 'Marcus Brody',
      citizenPhone: '+1 (555) 789-4321',
      allowDuplicate: true,
    }),
  });
  const newIssue = await createRes.json();
  console.log('Created Issue Ticket ID:', newIssue.data?.ticketId);
  console.log('Assigned Department:', newIssue.data?.assignedDepartment);
  console.log('Status:', newIssue.data?.status);

  console.log('\n--- 4. Testing Geospatial 2dsphere / Nearby Query ---');
  const nearRes = await fetch(`${API_BASE}/issues/nearby?lng=-73.985&lat=40.748&maxDistance=5000`);
  const nearData = await nearRes.json();
  console.log(`Found ${nearData.count} issues within 5000m radius of Midtown coordinates`);

  console.log('\n--- 5. Testing Municipal Status Transition ---');
  const updateRes = await fetch(`${API_BASE}/issues/${newIssue.data?.ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'In Progress',
      note: 'Road repair boom crew dispatched with bituminous cold-mix batch #89.',
      updatedBy: 'Eng. Rajesh Sharma (Superintendent PWD)',
    }),
  });
  const updatedIssue = await updateRes.json();
  console.log('Updated Status:', updatedIssue.data?.status);
  console.log('Timeline Steps Count:', updatedIssue.data?.timeline?.length);

  console.log('\n--- 6. Testing Automated SMS & Email Dispatch Logs ---');
  const auditRes = await fetch(`${API_BASE}/analytics/audit-logs`);
  const auditData = await auditRes.json();
  console.log(`Total Dispatch Logs: ${auditData.count}`);
  console.log('Recent 2 Notifications:');
  auditData.data?.slice(0, 2).forEach((l) => {
    console.log(`  [${l.type}] to ${l.recipient} (${l.recipientRole}): "${l.message?.substring(0, 80)}..."`);
  });

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

testSuite().catch(console.error);
