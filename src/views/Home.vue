<template>
<div class="container m-auto p-2 w-full min-h-screen min-w-full max-w-screen-2xl">
    <div class="grid grid-cols-4 gap-2">
        <div class="col-start-1 col-end-2 grid grid-rows-2 grid-flow-col gap-2 h-screen">
            <div class="grid row-span-1 grid-flow-col gap border-2 border-gray-800/100 rounded-md">
                <ControlPanel @emit-selected-dataset-changed="selectedDatasetChanged" :selectedPoints="selectedPoints" />
            </div>
            <div class="grid row-span-1 grid-flow-col gap border-2 border-gray-800/100 rounded-md">
                <ProjectionPanel @emit-selected-points-changed="selectedPointsChanged" :selectedDataset="selectedDataset" />
            </div>
        </div>
        <div class="col-start-2 col-end-4 border-2 border-gray-800/100 rounded-md h-screen">
            <ObliqueTreePanel :selectedPoints="selectedPoints" :selectedDataset="selectedDataset" />
        </div>
        <div class="col-start-4 col-end-5 border-2 border-gray-800/100 rounded-md h-screen">
            <FeaturePanel />
        </div>
    </div>
</div>
</template>
<script setup>
import { reactive, toRefs, onMounted } from "vue";
import ObliqueTreePanel from "../components/ObliqueTreePanel/ObliqueTreePanel.vue";
import ControlPanel from "../components/ControlPanel/ControlPanel.vue";
import ProjectionPanel from "../components/DataRepresentationPanels/ProjectionPanel.vue";
import FeaturePanel from "../components/FeaturePanel/FeaturePanel.vue";

const state = reactive({
    selectedPoints: [],
    selectedDataset: "penguins"
});

const selectedPointsChanged = (selectedPoints) => {
    state.selectedPoints = selectedPoints;
}

const selectedDatasetChanged = (selectedDataset) => {
    state.selectedDataset = selectedDataset;
}

onMounted(() => {
    
});

const { selectedPoints, selectedDataset } = toRefs(state);
</script>
<style scoped>
</style>