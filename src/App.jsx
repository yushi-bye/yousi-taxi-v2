
import { useState } from 'react'
import MapView from './components/MapView.jsx'
import Auth from './components/Auth.jsx'
export default function App(){
  const [user,setUser]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('yousi_user'))}catch{return null}
  })
  const [mode,setMode]=useState('passenger')
  const [rides,setRides]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('yousi_rides')||'[]')}catch{return []}
  })
  if(!user) return <Auth onLogin={u=>{localStorage.setItem('yousi_user',JSON.stringify(u)); setUser(u)}}/>
  return (<div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
    <header style={{background:'#111827',color:'white',padding:'12px 20px',display:'flex',justifyContent:'space-between'}}>
      <b style={{color:'#FACC15'}}>Yousi 玉里叫車 • LINE Pay真實版</b>
      <div style={{display:'flex',gap:8}}>
        {['passenger','driver','admin'].map(m=><button key={m} onClick={()=>setMode(m)} style={{padding:'6px 12px',borderRadius:20,border:'none',background:mode===m?'#FACC15':'#374151',color:mode===m?'black':'white'}}>{m==='passenger'?'乘客':m==='driver'?'司機':'後台'}</button>)}
        <button onClick={()=>{localStorage.removeItem('yousi_user'); setUser(null)}}>登出</button>
      </div>
    </header>
    <MapView mode={mode} user={user} rides={rides} setRides={setRides}/>
  </div>)
}
