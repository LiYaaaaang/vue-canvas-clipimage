<template>
    <div id="app">
        <clip-img @saveImage="saveImage" v-if="!isSave"></clip-img>
        <div class="resultBox" @click="isSave=false" v-else>
            <img :src="data" alt />
        </div>
    </div>
</template>

<script>
import ClipImg from "./components/ClipImg";
export default {
    name: "App",
    data() {
        return {
            isSave: false,
            data: ""
        };
    },
    components: {
        ClipImg
    },
    methods: {
        saveImage(payload) {
            // 父组件拿到图片base64，继续后面的操作
            // console.log(payload);
            this.isSave = true;
            this.data = payload;
        }
    }
};
</script>

<style lang="less">
.resultBox {
    padding: 0.3125rem;
}
.resultBox img {
    display: block;
    box-sizing: border-box;
    width: 9.375rem;
    height: 9.375rem;
    border: 0.03125rem solid #ddd;
}
</style>
