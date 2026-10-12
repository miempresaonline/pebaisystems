document.querySelectorAll('.r-service').forEach(item => item.addEventListener('toggle', () => {
  if(item.open) document.querySelectorAll('.r-service').forEach(other => {if(other!==item) other.open=false;});
  window.ScrollTrigger?.refresh();
}));
