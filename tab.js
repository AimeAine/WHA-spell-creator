function openTab(evt, tabName) {
  var menu_tabs = document.getElementsByClassName("menu_tab")
  for (var i = 0; i < menu_tabs.length; i++) {
    menu_tabs[i].children[0].classList = []
  }
  evt.target.classList = ["active"]
  var tabs = document.getElementsByClassName("tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].style.display = "none";
  }
  document.getElementById(tabName).style.display = "block";
}