async function testApi() {
  try {
    const res = await fetch('http://localhost:3000/api/system/health');
    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('FETCH ERROR:', err);
  }
}

testApi();
