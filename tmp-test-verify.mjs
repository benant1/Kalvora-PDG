async function main(){
  const loginResp = await fetch('http://localhost:4000/api/v1/auth/login',{ method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: 'test@test.com', password: 'password123' }) })
  const loginJson = await loginResp.json()
  console.log('LOGIN STATUS', loginResp.status, loginJson)
  const token = loginJson.token
  const verifyResp = await fetch('http://localhost:4000/api/v1/vendor/verify-pin',{ method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ pin: '1234' }) })
  const verifyJson = await verifyResp.json()
  console.log('VERIFY STATUS', verifyResp.status, verifyJson)
}

main().catch(e=>console.error(e))
