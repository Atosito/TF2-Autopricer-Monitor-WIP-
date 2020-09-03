<template>
<div>
  <b-navbar toggleable="lg" type="dark" sticky variant="secondary">
    <b-navbar-brand href="#">Wainot.trade</b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item @click="$router.push('/trades')">Trades</b-nav-item>
        <b-nav-item @click="$router.push('/profits')">Profits</b-nav-item>
        <b-nav-item @click="$router.push('/users')">Users</b-nav-item>
        <b-nav-item @click="$router.push('/inventory')">Inventory</b-nav-item>
        <b-nav-item href="#">Autopricer</b-nav-item>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">


        <b-nav-item-dropdown right>
          <!-- Using 'button-content' slot -->
          <template v-slot:button-content>
            <em>User</em>
          </template>
          <b-dropdown-item href="#">Profile</b-dropdown-item>
          <b-dropdown-item href="#">Sign Out</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</div>
</template>

<script>
export default {
  data() {
    return {
     
    };
  }
};
</script>

<style>

</style>
