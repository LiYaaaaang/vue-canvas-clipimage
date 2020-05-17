<template>
    <div class="clipImageBox">
        <div class="canvasBox" @touchstart="startFunc" @touchmove="moveFunc">
            <canvas :width="canvasW" :height="canvasH" ref="canvas"></canvas>
            <div
                class="mark"
                v-show="isMark"
                :style="{width:markW+'px',height:markH+'px',left:markL+'px',top:markT+'px'}"
            ></div>
        </div>
        <div class="buttonBox">
            <!-- accept="image/*"只允许上传图片 -->
            <input type="file" accept="image/*" class="file" ref="file" @change="changeFunc" />
            <button @click="clickFunc">选择图片</button>
            <button @click="scaleFunc(1)">放大</button>
            <button @click="scaleFunc(0)">缩小</button>
            <button @click="saveFunc">保存图片</button>
        </div>
    </div>
</template>

<script>
export default {
    /**
     * 1.我们需要准备一些数据：画布的大小，mark遮罩层的大小和位置，上传图片的大小和位置，控制mark显示，
     * 2.上传图片：选中图片，把其绘制到画布中()
     * 3.实现如图的方法和缩小：重新绘制图片的大小
     * 4.实现图片的拖拽touch，每次拖拽完后要重新绘制图片所在的位置
     * 5.保存图片的时候：把遮罩层选中的部分(像素)，生成一张新的图片
     */
    name: "clip-img",
    data() {
        let winW = document.documentElement.clientWidth;
        let font = parseFloat(document.documentElement.style.fontSize);
        let canvasW = winW - 0.3125 * 2 * font;
        let markW = canvasW * 0.7;
        return {
            //画布宽高
            canvasW: canvasW,
            canvasH: canvasW,
            // 遮罩层mark宽高
            markW: markW,
            markH: markW,
            // 遮罩层mark位置marginL，marginT
            markL: (canvasW - markW) / 2,
            markT: (canvasW - markW) / 2,
            // 上传图片的大小位置
            imageW: 0,
            imageH: 0,
            imageL: 0,
            imageT: 0,
            // 是否显示mark
            isMark: false
        };
    },
    methods: {
        clickFunc() {
            // 触发file选择文件的操作,就是触发input点击事件
            this.$refs.file.click();
        },
        changeFunc() {
            // 选择了图片
            this.isMark = true;
            // console.dir(this.$refs.file);
            let file = this.$refs.file.files[0];
            // 如果没有选择文件，files是个空集合
            if (!file) return;
            // 先基于fileReader进行文件读取
            let fileExample = new FileReader();
            fileExample.readAsDataURL(file);
            // 在onload中读取完毕
            fileExample.onload = ev => {
                // console.dir(ev.target);
                // 创建新图片 挂载到this实例上，方便全局使用
                this.IMAGE = new Image();
                this.IMAGE.src = ev.target.result;
                this.IMAGE.onload = () => {
                    // console.dir(this.IMAGE);
                    // 在这里创建完成
                    this.imageW = this.IMAGE.width;
                    this.imageH = this.IMAGE.height;
                    // 重新按照比例计算宽高,n为缩放比例，分为横向图片和纵向图片
                    let n = 1;
                    if (this.imageW > this.imageH) {
                        n = this.imageW / this.canvasW;
                        this.imageW = this.canvasW;
                        this.imageH = this.imageH / n;
                    } else {
                        n = this.imageH / this.canvasH;
                        this.imageH = this.canvasH;
                        this.imageW = this.imageW / n;
                    }
                    // 图片位置
                    this.imageL = (this.canvasW - this.imageW) / 2;
                    this.imageT = (this.canvasH - this.imageH) / 2;
                    // 绘制图片
                    this.drawImage();
                };
            };
        },
        scaleFunc(flag) {
            if (!this.IMAGE) return;
            let n = this.imageW / this.imageH;
            // 增加的宽
            let n1 = 20;
            // 增加的高
            let n2 = n1 / n;
            if (flag) {
                this.imageW += n1;
                this.imageH += n2;
            } else {
                this.imageW -= n1;
                this.imageH -= n2;
            }
            this.drawImage();
        },
        startFunc(ev) {
            if (!this.IMAGE) return;
            console.dir(ev);
            // 按下的时候获取手指的坐标
            let point = ev.changedTouches[0];
            this.startX = point.clientX;
            this.startY = point.clientY;
        },
        moveFunc(ev) {
            if (!this.IMAGE) return;
            let point = ev.changedTouches[0];
            this.changeX = point.clientX - this.startX;
            this.changeY = point.clientY - this.startY;
            // 10像素的误差偏移，设置大于10像素才算偏移，重新计算位置
            if (Math.abs(this.changeX) > 10 || Math.abs(this.changeY) > 10) {
                this.imageL += this.changeX;
                this.imageT += this.changeY;
                this.drawImage();
                // 把最后的坐标当做下一次最开始的值
                this.startX = point.clientX;
                this.startY = point.clientY;
            }
        },
        drawImage() {
            // 通过画布元素获取画布中指定画笔对象[上下文对象]
            this.CTX = this.$refs.canvas.getContext("2d");
            // 清除一个矩形范围所有元素
            this.CTX.clearRect(0, 0, this.canvasW, this.canvasH);
            // 绘制图片
            this.CTX.drawImage(
                this.IMAGE,
                this.imageL,
                this.imageT,
                this.imageW,
                this.imageH
            );
        },
        saveFunc() {
            if (!this.IMAGE) return;
            // 获取指定区域的像素信息
            let iamgeData = this.CTX.getImageData(
                this.markL,
                this.markT,
                this.markW,
                this.markH
            );
            // 创建第二张画布，通过第二张画布来帮我们生成图片
            let canvas2 = document.createElement("canvas");
            let canvas2CTX = canvas2.getContext("2d");
            canvas2.width = this.markW;
            canvas2.height = this.markH;
            // 把像素信息放置到画布当中
            canvas2CTX.putImageData(
                iamgeData,
                0,
                0,
                0,
                0,
                this.markW,
                this.markH
            );
            // 把画布的内容生成最终的图片的base64
            let imageBase64 = canvas2.toDataURL("image/png");
            this.$emit("saveImage", imageBase64);
        }
    }
};
</script>
<style lang='less' scoped>
.clipImageBox {
    padding: 0.3125rem;
}

.clipImageBox .canvasBox {
    position: relative;
    overflow: hidden;
}

.clipImageBox .canvasBox canvas {
    display: block;
    box-sizing: border-box;
    margin: 0 auto;
    width: 9.375rem;
    height: 9.375rem;
    border: 0.03125rem solid #ddd;
}

.clipImageBox .canvasBox .mark {
    box-sizing: border-box;
    position: absolute;
    z-index: 20;
    width: 70%;
    height: 70%;
    border: 0.03125rem solid lightcoral;
    background: rgba(0, 0, 0, 0.2);
}

.clipImageBox .buttonBox .file {
    display: none;
}

.clipImageBox .buttonBox {
    margin-top: 0.3125rem;
}

.clipImageBox .buttonBox button {
    margin-right: 0.15625rem;
    padding: 0.3125rem;
    border: none;
    font-size: 0.4375rem;
    background: lightblue;
    cursor: pointer;
}
</style>