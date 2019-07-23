//Base buttons
document.querySelector("#devTools").onclick = ()=> parent.thisWindow.toggleDevTools();
document.querySelector('#reload').onclick = ()=>{ parent.ipc.send('reload'); }