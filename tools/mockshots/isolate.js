<script>
(function(){
  var q=new URLSearchParams(location.hash.slice(1));
  var n=parseInt(q.get('n')||'0',10), theme=q.get('theme')||'light';
  var board=document.getElementById('board'); if(board) board.dataset.app=theme;
  if(!n) return;
  var shot=document.querySelectorAll('figure.shot')[n-1]; if(!shot) return;
  shot.setAttribute('data-iso','1');
  var css=document.createElement('style');
  css.textContent='html,body{margin:0!important;padding:0!important;overflow:hidden!important}'+
   'body *{visibility:hidden!important}'+
   'figure[data-iso] .phone, figure[data-iso] .phone *{visibility:visible!important}'+
   'figure[data-iso] .phone{position:fixed!important;left:0;top:0;zoom:1!important;width:402px!important;'+
   'height:874px!important;padding:0!important;border-radius:0!important;box-shadow:none!important;z-index:99999}'+
   'figure[data-iso] .screen{border-radius:0!important}';
  document.head.appendChild(css);
})();
</script>
