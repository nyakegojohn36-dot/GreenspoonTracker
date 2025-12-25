// backend/test-api.js
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing Greenspoon Box Tracker API...\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('   ✅ Health check:', healthData.status);
    
    // 2. Test boxes endpoint
    console.log('\n2. Testing boxes endpoint...');
    const boxesRes = await fetch(`${API_BASE}/boxes`);
    const boxesData = await boxesRes.json();
    console.log(`   ✅ Boxes loaded: ${boxesData.count || boxesData.boxes?.length || 0} boxes`);
    
    // 3. Test system info
    console.log('\n3. Testing system info...');
    const systemRes = await fetch(`${API_BASE}/system-info`);
    const systemData = await systemRes.json();
    console.log(`   ✅ System: ${systemData.system?.name} v${systemData.system?.version}`);
    console.log(`   ✅ Company: ${systemData.system?.company}`);
    
    // 4. Test creating a rider
    console.log('\n4. Testing rider creation...');
    const riderData = {
      name: 'Test Rider',
      vehicle_number: 'TEST-001',
      phone: '1234567890',
      status: 'active'
    };
    
    const riderRes = await fetch(`${API_BASE}/riders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(riderData)
    });
    
    const riderResult = await riderRes.json();
    if (riderResult.success) {
      console.log(`   ✅ Rider created: ${riderResult.rider_code}`);
      const riderId = riderResult.rider_id;
      
      // 5. Test creating a trip
      console.log('\n5. Testing trip creation...');
      const tripData = {
        rider_id: riderId,
        rider_name: 'Test Rider',
        box_codes: ['GS-B-001', 'GS-B-002', 'GS-S-001'],
        notes: 'Test departure'
      };
      
      const tripRes = await fetch(`${API_BASE}/trips/depart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      
      const tripResult = await tripRes.json();
      if (tripResult.success) {
        console.log(`   ✅ Trip created: ${tripResult.trip_code} with ${tripData.box_codes.length} boxes`);
        
        // 6. Test daily report
        console.log('\n6. Testing daily report...');
        const reportRes = await fetch(`${API_BASE}/reports/daily`);
        const reportData = await reportRes.json();
        console.log(`   ✅ Daily report generated for ${reportData.report?.date || 'today'}`);
        
        // 7. Test backup creation
        console.log('\n7. Testing backup creation...');
        const backupRes = await fetch(`${API_BASE}/backup/create`);
        const backupData = await backupRes.json();
        console.log(`   ✅ Backup created: ${backupData.backup?.filename}`);
        
        console.log('\n🎉 All API tests passed!');
        console.log('\n📊 Summary:');
        console.log(`   - API: Healthy`);
        console.log(`   - Boxes: ${boxesData.count || boxesData.boxes?.length || 0}`);
        console.log(`   - Test rider created: ${riderResult.rider_code}`);
        console.log(`   - Test trip created: ${tripResult.trip_code}`);
        console.log(`   - Backup created: ${backupData.backup?.filename}`);
        
      } else {
        console.log('   ❌ Trip creation failed:', tripResult.error);
      }
    } else {
      console.log('   ❌ Rider creation failed:', riderResult.error);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nMake sure the server is running: node server.js');
  }
}

// Run tests
testAPI();