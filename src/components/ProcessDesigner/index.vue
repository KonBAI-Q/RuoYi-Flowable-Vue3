<template>
  <div class="process-design" :style="'display: flex; height:' + height">
    <my-process-designer
      v-model="xmlString"
      v-bind="controlForm"
      keyboard
      ref="processDesigner"
      :events="[
        'element.click',
        'connection.added',
        'connection.removed',
        'connection.changed'
      ]"
      @element-click="elementClick"
      @init-finished="initModeler"
      @element-contextmenu="elementContextmenu"
      @save="onSaveProcess"
    />
    <my-process-penal :bpmn-modeler="modeler" :prefix="controlForm.prefix" class="process-panel" />

    <!-- demo config -->
    <div class="demo-control-bar">
      <div class="open-model-button" @click="controlDrawerVisible = true"><el-icon><setting /></el-icon></div>
    </div>
    <el-drawer v-model="controlDrawerVisible" size="400px" title="偏好设置" append-to-body destroy-on-close>
      <el-form :model="controlForm" size="small" label-width="100px" class="control-form" @submit.prevent>
        <el-form-item label="流程ID">
          <el-input v-model="controlForm.processId" @change="reloadProcessDesigner(true)" />
        </el-form-item>
        <el-form-item label="流程名称">
          <el-input v-model="controlForm.processName" @change="reloadProcessDesigner(true)" />
        </el-form-item>
        <el-form-item label="流转模拟">
          <el-switch v-model="controlForm.simulation" inactive-text="停用" active-text="启用" @change="reloadProcessDesigner()" />
        </el-form-item>
        <el-form-item label="禁用双击">
          <el-switch v-model="controlForm.labelEditing" inactive-text="停用" active-text="启用" @change="changeLabelEditingStatus" />
        </el-form-item>
        <el-form-item label="自定义渲染">
          <el-switch v-model="controlForm.labelVisible" inactive-text="停用" active-text="启用" @change="changeLabelVisibleStatus" />
        </el-form-item>
        <el-form-item label="流程引擎">
          <el-radio-group v-model="controlForm.prefix" @change="reloadProcessDesigner()">
            <el-radio label="camunda">camunda</el-radio>
            <el-radio label="flowable">flowable</el-radio>
            <el-radio label="activiti">activiti</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="工具栏">
          <el-radio-group v-model="controlForm.headerButtonSize">
            <el-radio label="small">small</el-radio>
            <el-radio label="default">default</el-radio>
            <el-radio label="large">large</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-switch v-model="pageMode" active-text="dark" inactive-text="light" @change="changePageMode"></el-switch>
      </el-form>
    </el-drawer>
  </div>
</template>

<script>
import MyProcessDesigner from '@/package/designer';
// import MyProcessPalette from '@/package/palette';
import MyProcessPenal from '@/package/penal';
// 自定义渲染（隐藏了 label 标签）
import CustomRenderer from '@/modules/custom-renderer';
// 自定义元素选中时的弹出菜单（修改 默认任务 为 用户任务）
import CustomContentPadProvider from '@/package/designer/plugins/content-pad';
// 自定义左侧菜单（修改 默认任务 为 用户任务）
import CustomPaletteProvider from '@/package/designer/plugins/palette';

import '@/package/theme/index.scss';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';

export default {
  name: 'ProcessDesigner',
  props: {
    bpmnXml: {
      type: String,
      required: true
    },
    designerForm: {
      type: Object,
      required: true
    }
  },
  components: {
    MyProcessDesigner,
    MyProcessPenal
  },
  data () {
    return {
      height: document.documentElement.clientHeight - 94.5 + "px;",
      xmlString: this.bpmnXml,
      modeler: null,
      controlDrawerVisible: false,
      infoTipVisible: false,
      pageMode: false,
      controlForm: {
        processId: this.designerForm.processKey || '',
        processName: this.designerForm.processName || '',
        simulation: true,
        labelEditing: false,
        labelVisible: false,
        prefix: 'flowable',
        headerButtonSize: 'default',
        additionalModel: [CustomContentPadProvider, CustomPaletteProvider]
      },
      addis: {
        CustomContentPadProvider,
        CustomPaletteProvider
      }
    }
  },
  methods: {
    reloadProcessDesigner(notDeep) {
      this.controlForm.additionalModel = [];
      for (const key in this.addis) {
        if (this.addis[key]) {
          this.controlForm.additionalModel.push(this.addis[key]);
        }
      }
      !notDeep && (this.xmlString = undefined);
      this.reloadIndex += 1;
      this.modeler = null; // 避免 panel 异常
    },
    changeLabelEditingStatus(status) {
      this.addis.labelEditing = status ? { labelEditingProvider: ['value', ''] } : false;
      this.reloadProcessDesigner();
    },
    changeLabelVisibleStatus(status) {
      this.addis.customRenderer = status ? CustomRenderer : false;
      this.reloadProcessDesigner();
    },
    elementClick(element) {
      this.element = element;
    },
    initModeler(modeler) {
      setTimeout(() => {
        this.modeler = modeler;
      }, 10);
    },
    elementContextmenu(element) {
    },
    onSaveProcess(saveData) {
      this.$emit('save', saveData);
    }
  }
}
</script>

<style lang="scss">
body {
  overflow: hidden;
  margin: 0;
  box-sizing: border-box;
}
body,
body * {
  /* 滚动条 */
  &::-webkit-scrollbar-track-piece {
    background-color: #fff; /*滚动条的背景颜色*/
    -webkit-border-radius: 0; /*滚动条的圆角宽度*/
  }

  &::-webkit-scrollbar {
    width: 10px; /*滚动条的宽度*/
    height: 8px; /*滚动条的高度*/
  }

  &::-webkit-scrollbar-thumb:vertical {
    /*垂直滚动条的样式*/
    height: 50px;
    background-color: rgba(153, 153, 153, 0.5);
    -webkit-border-radius: 4px;
    outline: 2px solid #fff;
    outline-offset: -2px;
    border: 2px solid #fff;
  }

  &::-webkit-scrollbar-thumb {
    /*滚动条的hover样式*/
    background-color: rgba(159, 159, 159, 0.3);
    -webkit-border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    /*滚动条的hover样式*/
    background-color: rgba(159, 159, 159, 0.5);
    -webkit-border-radius: 4px;
  }
}
.demo-control-bar {
  position: fixed;
  right: 8px;
  bottom: 48px;
  z-index: 1;
}
.open-model-button {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 32px;
  background: rgba(64, 158, 255, 1);
  color: #ffffff;
  cursor: pointer;
}
</style>
