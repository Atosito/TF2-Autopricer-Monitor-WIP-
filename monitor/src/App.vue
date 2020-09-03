<template>
  <div id="app" class="parent">
    <div class="div1">
          <router-view name="header" />
      </div>

    <div class="div2">
      <router-view />
    </div>
    <router-view name="footer" />
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Poppins&display=swap");
html,
body {
  font-family: "Poppins", sans-serif;
}
.web {
  padding-left: 0px !important;
}
.parent {
display: grid;
grid-template-columns: 1fr;
grid-template-rows: 60px 1fr;
grid-column-gap: 0px;
grid-row-gap: 0px;
}

.div1 { grid-area: 1 / 1 / 2 / 3; }
.div2 { grid-area: 2 / 1 / 3 / 2; }
</style>

