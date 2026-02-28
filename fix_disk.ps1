$file = "c:\Users\sebmo\Downloads\island\casino.html"
$c = [System.IO.File]::ReadAllText($file)
$count = 0


$old = "      document.getElementById('roulSpinBtn').disabled=false;`nUse the PREDETERMINED winner `u{2014} not visual readback `u{2014} to avoid mismatch bugs`n      const fNum=winNum;`n      const fRed=isActuallyRed;`n      const fGreen=isActuallyGreenas(fNum);`n      const fGreen=fNum===0;`n`n      const colorLabel=fGreen?'`u{1F49A} Green':(fRed?'`u{1F534} Red':'`u{26AB} Black');`n      const colorCSS=fGreen?'var(--green)':(fRed?'#ff5555':'#ccc');`n      document.getElementById('rouletteResult').innerHTML=`n        '<span style=""color:""+colorCSS+"">""'+fNum+' `u{2014} '+colorLabel+'</span>';`n`n      let won=false;`n      if(selectedRoulBet==='red'&&fRed)won=true;`n      if(selectedRoulBet==='black'&&!fRed&&!fGreen)won=true;`n      if(selectedRoulBet==='green'&&fGreen)won=true;`n      if(selectedRoulBet==='odd'&&fNum>0&&fNum%2===1)won=true;`n      if(selectedRoulBet==='even'&&fNum>0&&fNum%2===0)won=true;`n      if(selectedRoulBet==='1-18'&&fNum>=1&&fNum<=18)won=true;`n      if(selectedRoulBet==='19-36'&&fNum>=19&&fNum<=36)won=true;"
Write-Host "Looking for roulette old string..."
Write-Host "Contains PREDETERMINED: $($c.Contains('PREDETERMINED'))"
