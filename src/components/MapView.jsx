
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
const YULI_CENTER = [23.333, 121.314]
export default function MapView({mode, user, rides, setRides}){
  const mapDivRef=useRef(null); const mapRef=useRef(null); const markersRef=useRef([])
  const [pickup,setPickup]=useState({lat:23.333,lng:121.314,addr:'玉里車站'})
  const [dropoff,setDropoff]=useState({lat:23.331,lng:121.316,addr:'玉里醫院'})
  const [drivers,setDrivers]=useState(Array.from({length:15},(_,i)=>({id:i,lat:23.333+(Math.random()-0.5)*0.02,lng:121.314+(Math.random()-0.5)*0.02,name:`司機${i+1}`})))
  const [currentRide,setCurrentRide]=useState(null); const [selecting,setSelecting]=useState('pickup')
  const [payLoading,setPayLoading]=useState(false)
  useEffect(()=>{
    if(mapRef.current) return
    const map=L.map(mapDivRef.current).setView(YULI_CENTER,14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map)
    mapRef.current=map
    map.on('click',e=>{
      const {lat,lng}=e.latlng
      if(selecting==='pickup') setPickup({lat,lng,addr:`${lat.toFixed(4)},${lng.toFixed(4)} 地圖點選`})
      else setDropoff({lat,lng,addr:`${lat.toFixed(4)},${lng.toFixed(4)} 地圖點選`})
    })
  },[selecting])
  useEffect(()=>{
    if(!mapRef.current) return
    markersRef.current.forEach(m=>mapRef.current.removeLayer(m)); markersRef.current=[]
    const pickupIcon=L.divIcon({html:'🟢',className:'',iconSize:[30,30]})
    const dropIcon=L.divIcon({html:'🔴',className:'',iconSize:[30,30]})
    markersRef.current.push(L.marker([pickup.lat,pickup.lng],{icon:pickupIcon}).addTo(mapRef.current).bindPopup(pickup.addr))
    markersRef.current.push(L.marker([dropoff.lat,dropoff.lng],{icon:dropIcon}).addTo(mapRef.current).bindPopup(dropoff.addr))
    drivers.forEach(d=>{
      const icon=L.divIcon({html:`<div style="background:#FACC15;padding:2px 6px;border-radius:12px;border:2px solid black;font-size:12px">🚕${d.name}</div>`,className:'',iconSize:[60,20]})
      markersRef.current.push(L.marker([d.lat,d.lng],{icon}).addTo(mapRef.current))
    })
    markersRef.current.push(L.polyline([[pickup.lat,pickup.lng],[dropoff.lat,dropoff.lng]],{color:'#111827',dashArray:'8 8'}).addTo(mapRef.current))
  },[pickup,dropoff,drivers])
  useEffect(()=>{
    const iv=setInterval(()=>setDrivers(d=>d.map(x=>({...x,lat:x.lat+(Math.random()-0.5)*0.0005,lng:x.lng+(Math.random()-0.5)*0.0005}))),2000)
    return ()=>clearInterval(iv)
  },[])
  function haversine(a,b){const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
  const distance=haversine(pickup,dropoff); const calcFare=Math.round(75+distance*25)
  function requestRide(){
    const ride={id:'YS-'+Date.now(),passenger:user.phone||user.name,pickup,dropoff,distance:distance.toFixed(2),fare:calcFare,status:'matching',createdAt:new Date().toISOString()}
    setCurrentRide(ride); const newRides=[ride,...rides]; setRides(newRides); localStorage.setItem('yousi_rides',JSON.stringify(newRides))
    setTimeout(()=>setCurrentRide(r=>({...r,status:'matched',driver:drivers[0]})),2000)
  }
  async function handleLinePay(){
    if(!currentRide){alert('請先叫車產生訂單'); return}
    setPayLoading(true)
    try{
      const res=await fetch('/api/linepay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:currentRide.id, amount:currentRide.fare, productName:`玉里叫車 ${pickup.addr}→${dropoff.addr}`})})
      const data=await res.json()
      if(data.paymentUrl){ window.location.href=data.paymentUrl }
      else if(data.info){ alert(`後端已就緒，但尚未設定 LINE Pay 金鑰\n\n${data.info}\n\n訂單 ${currentRide.id} 金額 NT$${currentRide.fare}\n\n請到 Vercel → Settings → Environment Variables 設定：\nLINE_PAY_CHANNEL_ID\nLINE_PAY_CHANNEL_SECRET\n設定後 Redeploy 就能真實收款！`) }
      else { alert('回應：'+JSON.stringify(data)) }
    }catch(e){ alert('呼叫後端失敗：'+e.message) }
    setPayLoading(false)
  }
  if(mode==='admin') return <div style={{padding:20}}><h2>管理後台</h2><p>總 {rides.length} 筆</p><table border="1" cellPadding="8" style={{width:'100%'}}><thead><tr><th>ID</th><th>乘客</th><th>金額</th><th>狀態</th></tr></thead><tbody>{rides.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.passenger}</td><td>{r.fare}</td><td>{r.status}</td></tr>)}</tbody></table></div>
  if(mode==='driver') return <div style={{padding:20}}><h2>司機模式</h2><div ref={mapDivRef} style={{height:500,borderRadius:12}}></div></div>
  return (
    <div style={{flex:1,display:'flex',height:'100%'}}>
      <div style={{flex:1,position:'relative'}}>
        <div ref={mapDivRef} style={{width:'100%',height:'100%'}}></div>
        <div style={{position:'absolute',top:10,left:10,background:'white',padding:'8px 12px',borderRadius:20,zIndex:1000,display:'flex',gap:8,boxShadow:'0 2px 8px rgba(0,0,0,.2)'}}>
          <button onClick={()=>setSelecting('pickup')} style={{padding:'6px 12px',borderRadius:12,border:selecting==='pickup'?'2px solid black':'1px solid #ddd',background:selecting==='pickup'?'#FACC15':'white'}}>🟢 上車點</button>
          <button onClick={()=>setSelecting('dropoff')} style={{padding:'6px 12px',borderRadius:12,border:selecting==='dropoff'?'2px solid black':'1px solid #ddd',background:selecting==='dropoff'?'#FACC15':'white'}}>🔴 下車點</button>
        </div>
      </div>
      <div style={{width:380,background:'white',padding:20,borderLeft:'1px solid #ddd',overflowY:'auto'}}>
        <h3>叫車 • 真實地圖 + 真實收款</h3>
        <label>上車</label><input value={pickup.addr} onChange={e=>setPickup({...pickup,addr:e.target.value})} style={{width:'100%',padding:8,marginBottom:8,border:'2px solid #22c55e',borderRadius:8}}/>
        <label>下車</label><input value={dropoff.addr} onChange={e=>setDropoff({...dropoff,addr:e.target.value})} style={{width:'100%',padding:8,marginBottom:8,border:'2px solid #ef4444',borderRadius:8}}/>
        <p>距離 {distance.toFixed(2)}km | 預估 NT${calcFare}</p>
        <button onClick={requestRide} style={{width:'100%',padding:14,background:'#111827',color:'#FACC15',border:'none',borderRadius:12,fontWeight:'bold',fontSize:16}}>立即叫車 NT${calcFare}</button>
        {currentRide && <div style={{marginTop:12,padding:12,background:'#f0fdf4',borderRadius:12,border:'1px solid #22c55e'}}><b>{currentRide.id}</b><p>狀態:{currentRide.status}</p></div>}
        <div style={{marginTop:20,padding:12,background:'#f8fafc',borderRadius:12}}>
          <h4>付款 • 真實串接已就緒</h4>
          <button onClick={handleLinePay} disabled={payLoading} style={{width:'100%',padding:12,background:'#00C300',color:'white',border:'none',borderRadius:8,marginBottom:8,fontWeight:'bold',fontSize:16}}>{payLoading?'處理中...':'LINE Pay 真實付款'}</button>
          <button style={{width:'100%',padding:10,background:'#E60012',color:'white',border:'none',borderRadius:8}}>街口支付 (待金鑰)</button>
          <div style={{marginTop:10,fontSize:11,color:'#666',background:'white',padding:8,borderRadius:8}}>
            <b>如何啟用真實收款：</b><br/>1. 到 pay.line.me 申請商家<br/>2. Vercel → Settings → Env 加入<br/>LINE_PAY_CHANNEL_ID<br/>LINE_PAY_CHANNEL_SECRET<br/>LINE_PAY_SANDBOX=true<br/>3. Redeploy
          </div>
        </div>
      </div>
    </div>
  )
}
