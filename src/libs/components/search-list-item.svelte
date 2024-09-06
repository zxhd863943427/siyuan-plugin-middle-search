<script lang="ts">
    export let searchItem:SearchItem
    import {createEventDispatcher} from "svelte"
    const dispatch = createEventDispatcher()
    function selectSearchResult(searchItem:SearchItem) {
        dispatch('selectSearchResult', searchItem);
    } 
</script>

<button 
    class="b3-list-item__text search-list-item" 
    on:click={()=>{selectSearchResult(searchItem)}}>
   {@html searchItem.content}
</button>

<style>

.search-list-item{
       padding: 2px 4px;
        margin: 0.2em;
        width: 98%;
        font-size: 1.1em;
        border: solid 1px var(--b3-theme-surface-lighter);
        border-radius: var(--b3-border-radius);
        box-shadow: inset 0 -1px 0 var(--b3-theme-surface-lighter);
        white-space: nowrap;
    }
</style>