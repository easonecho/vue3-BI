<template>
  <div class="dataset-manage-page">
    <el-card class="page-card" shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索数据集名称/描述"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.datasourceId"
          placeholder="按数据源筛选"
          filterable
          clearable
          style="width: 200px"
          @change="handleSearch"
        >
          <el-option
            v-for="d in dsOptions"
            :key="d.id"
            :label="`${d.name} (${d.type?.toUpperCase()})`"
            :value="d.id"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>&nbsp;查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>&nbsp;重置
        </el-button>
        <div class="spacer" />
        <el-button plain @click="lineageVisible = true">
          <el-icon><Connection /></el-icon>&nbsp;数据血缘
        </el-button>
        <el-button type="warning" plain @click="openUploadDialog">
          <el-icon><Upload /></el-icon>&nbsp;上传 Excel/CSV
        </el-button>
        <el-button type="success" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>&nbsp;新增数据集
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" style="margin-top: 16px" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'file'" size="small" type="warning">文件</el-tag>
            <el-tag v-else size="small" type="primary" effect="plain">SQL</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据源" min-width="140">
          <template #default="{ row }">
            <span v-if="row.datasource">
              <el-tag size="small" effect="plain">{{ row.datasource.type?.toUpperCase() }}</el-tag>
              &nbsp;{{ row.datasource.name }}
            </span>
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="参数" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.params && row.params.length" size="small" type="warning"
              >{{ row.params.length }}个</el-tag
            >
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="字段配置" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.fields && row.fields.length" size="small" type="success"
              >{{ row.fields.length }}个</el-tag
            >
            <span v-else style="color: #9ca3af">-</span>
          </template>
        </el-table-column>
        <el-table-column label="缓存" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.cacheEnabled" size="small" type="success"
              >TTL {{ row.cacheTtl || 300 }}s</el-tag
            >
            <el-tag v-else size="small" type="info">未开启</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SQL / 数据文件" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.type === 'file'">
              <code class="sql-code"
                >{{ row.fileData?.fileName || '-' }} ({{ row.fileData?.rowCount ?? 0 }} 行)</code
              >
            </template>
            <code v-else class="sql-code">{{ row.sql }}</code>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="previewRow(row)">预览</el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button link type="primary" size="small" @click="openRowPermissions(row)"
              >行级权限</el-button
            >
            <el-button link type="primary" size="small" @click="openColumnPermissions(row)"
              >列级权限</el-button
            >
            <el-button link type="primary" size="small" @click="openAlerts(row)">告警</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => handleExport(row, cmd as ExportFormat)">
              <el-button link type="primary" size="small">
                导出<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv">CSV</el-dropdown-item>
                  <el-dropdown-item command="xlsx">Excel (.xlsx)</el-dropdown-item>
                  <el-dropdown-item command="json">JSON</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-popconfirm
              title="确定删除该数据集吗?"
              confirm-button-type="danger"
              @confirm="handleDelete(row)"
            >
              <template #reference
                ><el-button link type="danger" size="small">删除</el-button></template
              >
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="mode === 'create' ? '新增数据集' : '编辑数据集'"
      width="1000px"
      destroy-on-close
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本配置" name="basic">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
            <el-form-item label="数据集名称" prop="name">
              <el-input v-model="form.name" maxlength="100" placeholder="业务显示名" />
            </el-form-item>
            <el-form-item v-if="form.type === 'file'" label="数据类型">
              <el-tag type="warning" size="small">文件数据集 (Excel/CSV, 无需数据源)</el-tag>
            </el-form-item>
            <el-form-item v-else label="关联数据源" prop="datasourceId">
              <el-select
                v-model="form.datasourceId"
                filterable
                placeholder="选择数据源"
                style="width: 100%"
              >
                <el-option
                  v-for="d in dsOptions"
                  :key="d.id"
                  :label="`${d.name} (${d.type?.toUpperCase()})`"
                  :value="d.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="缓存开关" prop="cacheEnabled">
              <el-switch v-model="form.cacheEnabled" />
              <span style="margin-left: 12px; color: #6b7280; font-size: 13px"
                >启用后相同查询在 TTL 内走内存缓存</span
              >
            </el-form-item>
            <el-form-item label="缓存 TTL" prop="cacheTtl">
              <el-input-number
                v-model="form.cacheTtl"
                :min="0"
                :max="86400"
                controls-position="right"
                style="width: 200px"
              />
              <span v-pre style="margin-left: 12px; color: #6b7280; font-size: 13px">秒</span>
            </el-form-item>
            <el-form-item label="描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="2"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane v-if="form.type === 'file'" label="数据文件" name="datafile">
          <div v-if="form.fileData" class="file-meta">
            <div class="file-meta__row">
              <span class="file-meta__label">当前文件</span>
              <code>{{ form.fileData.fileName || '-' }}</code>
            </div>
            <div class="file-meta__row">
              <span class="file-meta__label">数据规模</span>
              <span>{{ form.fileData.rowCount ?? 0 }} 行</span>
            </div>
            <div class="file-meta__row">
              <span class="file-meta__label">更新时间</span>
              <span>{{ formatFileTime(form.fileData.updatedAt) }}</span>
            </div>
          </div>
          <div style="margin: 12px 0">
            <el-upload
              :auto-upload="false"
              :limit="1"
              accept=".xlsx,.csv"
              :on-change="onReplaceFileChange"
              :on-remove="() => (replaceFile = null)"
              :file-list="replaceFile ? [{ name: replaceFile.name }] : []"
            >
              <el-button size="small" type="primary" plain>
                <el-icon><Upload /></el-icon>&nbsp;选择新的数据文件
              </el-button>
              <template #tip>
                <div style="color: #9ca3af; font-size: 12px; margin-top: 4px">
                  支持 .xlsx / .csv, 最大 10MB、5 万行; 替换后立即生效并清理缓存
                </div>
              </template>
            </el-upload>
          </div>
          <el-button
            type="success"
            :loading="replacing"
            :disabled="!replaceFile"
            @click="handleReplaceConfirm"
          >
            替换数据文件
          </el-button>
          <el-divider />
          <el-button @click="previewCurrentDataset">预览数据 (前 100 行)</el-button>
        </el-tab-pane>

        <el-tab-pane v-else label="SQL 查询" name="sql">
          <el-form :model="form" label-width="96px">
            <el-form-item label="SQL 查询" prop="sql">
              <SqlEditor
                v-model="form.sql"
                :height="240"
                label="SQL"
                placeholder="SELECT col1, col2 FROM table_name WHERE col = {{paramName}} ..."
              />
              <div v-pre style="color: #9ca3af; font-size: 12px; margin-top: 4px">
                仅允许 SELECT 查询。使用 {{ paramName }} 引用参数（在"参数配置"标签页定义）。
              </div>
            </el-form-item>
          </el-form>
          <el-button :disabled="!(form.datasourceId && form.sql)" @click="previewCurrentForm">
            校验 SQL 并预览
          </el-button>
        </el-tab-pane>

        <el-tab-pane
          :label="`参数配置${form.params && form.params.length ? ' (' + form.params.length + ')' : ''}`"
          name="params"
        >
          <div style="margin-bottom: 12px">
            <el-button type="primary" size="small" @click="addParam">
              <el-icon><Plus /></el-icon>&nbsp;新增参数
            </el-button>
            <span v-pre style="margin-left: 12px; color: #6b7280; font-size: 13px">
              在 SQL 中使用 {{ paramName }} 引用参数, 执行时动态替换
            </span>
          </div>
          <el-table :data="form.params || []" size="small" border>
            <el-table-column label="参数名" width="140">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" placeholder="如: startDate" />
              </template>
            </el-table-column>
            <el-table-column label="标签" width="120">
              <template #default="{ row }">
                <el-input v-model="row.label" size="small" placeholder="显示名" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                <el-select v-model="row.type" size="small" style="width: 100%">
                  <el-option label="字符串" value="string" />
                  <el-option label="数字" value="number" />
                  <el-option label="日期" value="date" />
                  <el-option label="日期时间" value="datetime" />
                  <el-option label="布尔" value="boolean" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="默认值" width="140">
              <template #default="{ row }">
                <el-input v-model="row.defaultValue" size="small" placeholder="可选" />
              </template>
            </el-table-column>
            <el-table-column label="必填" width="80" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.required" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="removeParam($index)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <el-empty
            v-if="!form.params || form.params.length === 0"
            description="暂无参数, 点击上方新增"
            :image-size="60"
          />
        </el-tab-pane>

        <el-tab-pane v-if="form.type !== 'file'" label="抽取模式" name="extract">
          <el-alert type="info" :closable="false" style="margin-bottom: 16px">
            抽取模式将 SQL 结果物化为本地快照: 图表取数直接读快照, 不再实时查询源库。
            快照不会自动刷新, 源数据更新后需点击「立即抽取」。
          </el-alert>
          <template v-if="mode === 'edit'">
            <el-descriptions v-if="extractInfo.enabled" :column="3" border size="small">
              <el-descriptions-item label="状态">
                <el-tag type="success" size="small">已启用</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="快照行数">
                {{ extractInfo.rowCount }}
              </el-descriptions-item>
              <el-descriptions-item label="最近抽取">
                {{ formatFileTime(extractInfo.lastExtractAt || undefined) }}
              </el-descriptions-item>
            </el-descriptions>
            <el-empty
              v-if="!extractInfo.enabled"
              description="尚未启用抽取, 当前为实时查询"
              :image-size="60"
            />
            <div class="extract-actions">
              <el-button type="primary" :loading="extracting" @click="handleExtract">
                立即抽取
              </el-button>
              <el-popconfirm
                v-if="extractInfo.enabled"
                title="取消后将恢复实时查询源库, 确定吗?"
                @confirm="handleRemoveExtract"
              >
                <template #reference>
                  <el-button :loading="removingExtract">取消抽取</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
          <el-alert v-else type="warning" :closable="false">保存数据集后才能执行抽取</el-alert>
        </el-tab-pane>

        <el-tab-pane
          :label="`字段管理${form.fields && form.fields.length ? ' (' + form.fields.length + ')' : ''}`"
          name="fields"
        >
          <div style="margin-bottom: 12px">
            <el-button type="primary" size="small" @click="addField">
              <el-icon><Plus /></el-icon>&nbsp;新增字段
            </el-button>
            <el-button
              size="small"
              :disabled="!previewData.columns.length"
              @click="autoDetectFields"
            >
              从预览结果自动检测
            </el-button>
            <span v-pre style="margin-left: 12px; color: #6b7280; font-size: 13px">
              配置字段别名、类型转换、计算字段
            </span>
            <div v-pre style="color: #9ca3af; font-size: 12px; margin-top: 6px; line-height: 1.7">
              计算字段表达式支持: 算术 (+ - * / % ^)、比较 (= != > >= &lt; &lt;=)、逻辑 (and or not)、三元
              (cond ? a : b);
              函数: ABS ROUND CEIL FLOOR SQRT POW MIN MAX IF COALESCE NULLIF CONCAT LEFT RIGHT LEN
              UPPER LOWER TRIM SUBSTRING REPLACE CONTAINS STARTSWITH ENDSWITH YEAR MONTH DAY
              DATEDIFF NOW NUMBER STRING DATE; 字段名直接书写或用
              {{字段名}} 引用, 例如: ROUND({{price}} * {{quantity}}, 2)
            </div>
          </div>
          <el-table :data="form.fields || []" size="small" border>
            <el-table-column label="字段名" width="140">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" placeholder="如: price" />
              </template>
            </el-table-column>
            <el-table-column label="别名" width="120">
              <template #default="{ row }">
                <el-input v-model="row.alias" size="small" placeholder="显示名" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="110">
              <template #default="{ row }">
                <el-select v-model="row.type" size="small" clearable style="width: 100%">
                  <el-option label="字符串" value="string" />
                  <el-option label="数字" value="number" />
                  <el-option label="日期" value="date" />
                  <el-option label="日期时间" value="datetime" />
                  <el-option label="布尔" value="boolean" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="语义角色" width="96" align="center">
              <template #default="{ row }">
                <el-select
                  :model-value="row.role"
                  size="small"
                  placeholder="未设置"
                  clearable
                  style="width: 100%"
                  @update:model-value="(v: string | undefined) => setFieldRole(row, v)"
                >
                  <el-option label="维度" value="dimension" />
                  <el-option label="度量" value="measure" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="默认聚合" width="110" align="center">
              <template #default="{ row }">
                <el-select
                  :model-value="row.defaultAggregate"
                  size="small"
                  placeholder="不聚合"
                  clearable
                  :disabled="row.role === 'dimension'"
                  style="width: 100%"
                  @update:model-value="(v: string | undefined) => setFieldDefaultAggregate(row, v)"
                >
                  <el-option
                    v-for="opt in AGGREGATE_UI_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="显示格式" width="168">
              <template #default="{ row }">
                <div style="display: flex; gap: 4px">
                  <el-select
                    :model-value="row.format?.type"
                    size="small"
                    placeholder="默认"
                    clearable
                    style="flex: 1"
                    @update:model-value="(v: string | undefined) => setFieldFormat(row, v)"
                  >
                    <el-option
                      v-for="opt in FORMAT_UI_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                  <el-input-number
                    v-if="
                      row.format?.type === 'number' ||
                      row.format?.type === 'currency' ||
                      row.format?.type === 'percent'
                    "
                    :model-value="row.format?.decimals"
                    size="small"
                    :min="0"
                    :max="6"
                    controls-position="right"
                    style="width: 74px"
                    @update:model-value="(v: number | undefined) => setFieldDecimals(row, v)"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="可见" width="70" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.visible" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="计算字段" width="90" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.computed" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="表达式" min-width="200">
              <template #default="{ row }">
                <el-input
                  v-model="row.expression"
                  size="small"
                  :disabled="!row.computed"
                  placeholder="如: {{price}} * {{quantity}}"
                />
              </template>
            </el-table-column>
            <el-table-column label="校验" width="70" align="center">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :disabled="!row.computed || !row.expression"
                  @click="validateExpr(row)"
                  >校验</el-button
                >
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="removeField($index)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <el-empty
            v-if="!form.fields || form.fields.length === 0"
            description="暂无字段配置, 可从预览结果自动检测"
            :image-size="60"
          />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 上传 Excel/CSV 数据集对话框 -->
    <el-dialog v-model="uploadVisible" title="上传 Excel/CSV 创建数据集" width="520px" destroy-on-close>
      <el-form label-width="96px">
        <el-form-item label="数据集名称">
          <el-input
            v-model="uploadForm.name"
            maxlength="100"
            placeholder="留空则使用文件名"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            placeholder="可选"
          />
        </el-form-item>
        <el-form-item label="数据文件" required>
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.csv"
            :on-change="onUploadFileChange"
            :on-remove="() => (uploadForm.file = null)"
            :file-list="uploadForm.file ? [{ name: uploadForm.file.name }] : []"
            style="width: 100%"
          >
            <el-icon style="font-size: 32px; color: #9ca3af"><Upload /></el-icon>
            <div style="color: #6b7280; font-size: 13px">拖拽文件到此处, 或点击选择</div>
            <template #tip>
              <div style="color: #9ca3af; font-size: 12px">
                支持 .xlsx / .csv (首行为表头), 最大 10MB、5 万行、200 列
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!uploadForm.file" @click="handleUploadConfirm">
          上传并创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 行级权限管理 -->
    <DatasetRowPermissions
      v-model="rowPermissionVisible"
      :dataset="rowPermissionDataset"
      @saved="loadList"
    />

    <!-- 列级权限管理 -->
    <DatasetColumnPermissions
      v-model="columnPermissionVisible"
      :dataset="columnPermissionDataset"
      @saved="loadList"
    />

    <!-- 告警订阅管理 -->
    <DatasetAlerts v-model="alertVisible" :dataset="alertDataset" />

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="数据预览 (最多 100 行)" width="720px">
      <div v-loading="previewLoading" style="max-height: 420px; overflow: auto">
        <el-table
          v-if="previewData.rows && previewData.rows.length"
          :data="previewData.rows"
          size="small"
          stripe
          border
        >
          <el-table-column
            v-for="col in previewData.columns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="130"
            show-overflow-tooltip
          />
        </el-table>
        <el-empty v-else-if="!previewLoading" description="查询结果为空" />
      </div>
      <div style="margin-top: 8px; color: #6b7280; font-size: 13px">
        总行数: {{ previewData.rowCount ?? '-' }}
      </div>
    </el-dialog>

    <!-- 数据血缘 (P2-3) -->
    <DataLineage v-model="lineageVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Search, Refresh, Plus, Upload, ArrowDown, Connection } from '@element-plus/icons-vue'
import DataLineage from './components/DataLineage.vue'
import {
  type CreateDatasetParams,
  type DatasetField,
  getDatasetList,
  createDataset,
  updateDataset,
  deleteDataset,
  executeDataset,
  previewSql,
  uploadDataset,
  replaceDatasetData,
  validateCalcExpression,
  getDatasetExtract,
  extractDataset,
  removeDatasetExtract,
  type DatasetExtractInfo,
} from '@/api/dataset'
import type { Dataset, DataSource } from '@/api/types'
import { getDataSourceList } from '@/api/datasource'
import { exportDatasetByFormat, saveAs, type ExportFormat } from '@/api/export'
import SqlEditor from '@/components/SqlEditor.vue'
import DatasetRowPermissions from './components/DatasetRowPermissions.vue'
import DatasetColumnPermissions from './components/DatasetColumnPermissions.vue'
import DatasetAlerts from './components/DatasetAlerts.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filters = reactive<{ keyword?: string; datasourceId?: number }>({
  keyword: '',
  datasourceId: undefined,
})
const dsOptions = ref<DataSource[]>([])

async function loadDsOptions() {
  try {
    const res = await getDataSourceList({ page: 1, pageSize: 100 })
    dsOptions.value = res.data.list || []
  } catch {
    /* noop */
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await getDatasetList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
      datasourceId: filters.datasourceId,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}
function handleReset() {
  filters.keyword = ''
  filters.datasourceId = undefined
  handleSearch()
}

// ---------- dialog ----------
const dialogVisible = ref(false)
const lineageVisible = ref(false)
const mode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const activeTab = ref('basic')

// ---------- 抽取模式 (P2-1) ----------
const extracting = ref(false)
const removingExtract = ref(false)
const extractInfo = ref<DatasetExtractInfo>({
  enabled: false,
  rowCount: 0,
  lastExtractAt: null,
})

async function loadExtractInfo(id: number) {
  try {
    const res = await getDatasetExtract(id)
    extractInfo.value = res.data
  } catch {
    extractInfo.value = { enabled: false, rowCount: 0, lastExtractAt: null }
  }
}

async function handleExtract() {
  if (!form.id) return
  extracting.value = true
  try {
    const res = await extractDataset(form.id)
    extractInfo.value = res.data
    ElMessage.success(
      res.data.truncated
        ? `数据抽取完成 (超过上限, 仅保留 ${res.data.rowCount} 行)`
        : `数据抽取完成 (${res.data.rowCount} 行)`,
    )
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    extracting.value = false
  }
}

async function handleRemoveExtract() {
  if (!form.id) return
  removingExtract.value = true
  try {
    await removeDatasetExtract(form.id)
    extractInfo.value = { enabled: false, rowCount: 0, lastExtractAt: null }
    ElMessage.success('已取消抽取, 恢复实时查询')
  } catch {
    // 错误提示由 request 拦截器统一处理
  } finally {
    removingExtract.value = false
  }
}

const form = reactive<
  CreateDatasetParams & {
    id?: number
    type?: 'sql' | 'file'
    fileData?: Dataset['fileData']
    /** UI 编辑态始终有值 (v-model 绑定要求非 undefined) */
    sql: string
    cacheTtl: number
  }
>({
  id: undefined,
  name: '',
  datasourceId: 0,
  sql: '',
  cacheEnabled: false,
  cacheTtl: 300,
  description: '',
  fields: [],
  params: [],
  type: 'sql',
  fileData: undefined,
})

/** 动态校验规则: 文件数据集无需数据源/SQL */
const rules = computed<FormRules>(() => {
  const base: FormRules = {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      { max: 100, trigger: 'blur' },
    ],
    cacheTtl: [
      { type: 'number', min: 0, max: 86400, message: 'TTL 需在 0-86400 秒', trigger: 'blur' },
    ],
  }
  if (form.type === 'file') return base
  base.datasourceId = [{ required: true, message: '请选择数据源', trigger: 'change' }]
  base.sql = [{ required: true, message: '请输入 SQL', trigger: 'blur' }]
  return base
})

function openCreateDialog() {
  mode.value = 'create'
  activeTab.value = 'basic'
  extractInfo.value = { enabled: false, rowCount: 0, lastExtractAt: null }
  Object.assign(form, {
    id: undefined,
    name: '',
    datasourceId: dsOptions.value[0]?.id ?? 0,
    sql: '',
    cacheEnabled: false,
    cacheTtl: 300,
    description: '',
    fields: [],
    params: [],
    type: 'sql',
    fileData: undefined,
  })
  dialogVisible.value = true
}
function openEditDialog(row: Dataset & any) {
  mode.value = 'edit'
  activeTab.value = 'basic'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    datasourceId: row.datasourceId,
    sql: row.sql,
    cacheEnabled: !!row.cacheEnabled,
    cacheTtl: row.cacheTtl ?? 300,
    description: row.description ?? '',
    fields: Array.isArray(row.fields) ? row.fields.map(normalizeFieldForEdit) : [],
    params: Array.isArray(row.params) ? [...row.params] : [],
    type: row.type === 'file' ? 'file' : 'sql',
    fileData: row.fileData ?? undefined,
  })
  replaceFile.value = null
  dialogVisible.value = true
  // 抽取状态单独拉取 (列表数据不含快照摘要)
  if (form.type !== 'file') loadExtractInfo(row.id)
}

// ---------- 参数配置 ----------
function addParam() {
  if (!form.params) form.params = []
  form.params.push({ name: '', label: '', type: 'string', defaultValue: '', required: false })
}
function removeParam(idx: number) {
  form.params?.splice(idx, 1)
}

// ---------- 字段管理 ----------

/** 编辑回填: 兼容旧数据中 format 为字符串的写法 */
function normalizeFieldForEdit(field: any): DatasetField {
  const format = field?.format
  return {
    ...field,
    format:
      format && typeof format === 'object' ? (format as DatasetField['format']) : undefined,
  }
}

/** 语义层: 默认聚合选项 */
const AGGREGATE_UI_OPTIONS = [
  { label: '不聚合', value: 'none' },
  { label: '求和', value: 'sum' },
  { label: '平均值', value: 'avg' },
  { label: '计数', value: 'count' },
  { label: '去重计数', value: 'countDistinct' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
]

/** 语义层: 显示格式选项 */
const FORMAT_UI_OPTIONS = [
  { label: '数值', value: 'number' },
  { label: '货币', value: 'currency' },
  { label: '百分比', value: 'percent' },
  { label: '日期', value: 'date' },
  { label: '文本', value: 'text' },
]

function setFieldRole(row: DatasetField, role?: string) {
  row.role = (role || undefined) as DatasetField['role']
  // 维度不参与聚合; 度量未设置默认聚合时给出常用默认值
  if (!row.role) {
    row.defaultAggregate = undefined
  } else if (row.role === 'dimension') {
    row.defaultAggregate = 'none'
  } else if (!row.defaultAggregate || row.defaultAggregate === 'none') {
    row.defaultAggregate = 'sum'
  }
}

function setFieldDefaultAggregate(row: DatasetField, value?: string) {
  row.defaultAggregate = (value || undefined) as DatasetField['defaultAggregate']
}

function setFieldFormat(row: DatasetField, type?: string) {
  if (!type) {
    row.format = undefined
    return
  }
  row.format = {
    ...(row.format ?? {}),
    type: type as NonNullable<DatasetField['format']>['type'],
  }
  if (['number', 'currency', 'percent'].includes(type) && row.format.decimals === undefined) {
    row.format.decimals = type === 'percent' ? 1 : 2
  }
}

function setFieldDecimals(row: DatasetField, decimals?: number) {
  row.format = { ...(row.format ?? {}), decimals: decimals ?? undefined }
}

/** 根据预览数据首行非空值推断列语义 (数字 → 度量/求和, 其余 → 维度) */
function inferFieldSemantic(col: string): Partial<DatasetField> {
  const sample = previewData.value.rows
    .slice(0, 20)
    .map((r) => r?.[col])
    .find((v) => v !== null && v !== undefined && v !== '')
  const numeric =
    typeof sample === 'number' ||
    (typeof sample === 'string' && sample.trim() !== '' && Number.isFinite(Number(sample)))
  return numeric
    ? { type: 'number', role: 'measure', defaultAggregate: 'sum' }
    : { type: 'string', role: 'dimension', defaultAggregate: 'none' }
}

function addField() {
  if (!form.fields) form.fields = []
  form.fields.push({
    name: '',
    alias: '',
    type: 'string',
    visible: true,
    computed: false,
    expression: '',
    role: 'dimension',
    defaultAggregate: 'none',
  })
}
function removeField(idx: number) {
  form.fields?.splice(idx, 1)
}
function autoDetectFields() {
  if (!previewData.value.columns.length) return
  if (!form.fields) form.fields = []
  const existingNames = form.fields.map((f) => f.name)
  for (const col of previewData.value.columns) {
    if (!existingNames.includes(col)) {
      form.fields.push({
        name: col,
        alias: '',
        visible: true,
        computed: false,
        ...inferFieldSemantic(col),
      })
    }
  }
  ElMessage.success(`已添加 ${previewData.value.columns.length} 个字段`)
}

async function submitForm() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) {
    activeTab.value = 'basic'
    return
  }
  const isFile = form.type === 'file'
  if (!isFile && !form.sql) {
    activeTab.value = 'sql'
    ElMessage.warning('请输入 SQL')
    return
  }
  submitting.value = true
  try {
    // 文件数据集不提交数据源/SQL
    const payload: CreateDatasetParams = isFile
      ? {
          name: form.name,
          description: form.description,
          cacheEnabled: form.cacheEnabled,
          cacheTtl: form.cacheTtl,
          fields: form.fields && form.fields.length ? form.fields : undefined,
        }
      : {
          name: form.name,
          datasourceId: form.datasourceId,
          sql: form.sql,
          description: form.description,
          cacheEnabled: form.cacheEnabled,
          cacheTtl: form.cacheTtl,
          fields: form.fields && form.fields.length ? form.fields : undefined,
          params: form.params && form.params.length ? form.params : undefined,
        }
    if (mode.value === 'create') {
      await createDataset(payload)
      ElMessage.success('创建数据集成功')
    } else if (form.id) {
      await updateDataset(form.id, payload)
      ElMessage.success('保存成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

// ---------- 上传 Excel/CSV 数据集 ----------
const uploadVisible = ref(false)
const uploading = ref(false)
const uploadForm = reactive<{ name: string; description: string; file: File | null }>({
  name: '',
  description: '',
  file: null,
})

function openUploadDialog() {
  uploadForm.name = ''
  uploadForm.description = ''
  uploadForm.file = null
  uploadVisible.value = true
}

function onUploadFileChange(file: UploadFile) {
  if (!acceptUpload(file)) return
  uploadForm.file = (file.raw as File) ?? null
}

/** 前置校验: 扩展名 + 大小 (后端仍会校验) */
function acceptUpload(file: UploadFile): boolean {
  const raw = file.raw as File | undefined
  if (!raw) return false
  const ext = raw.name.slice(raw.name.lastIndexOf('.')).toLowerCase()
  if (ext !== '.xlsx' && ext !== '.csv') {
    ElMessage.error(`不支持的文件格式 "${ext}", 仅支持 .xlsx / .csv`)
    return false
  }
  if (raw.size > 10 * 1024 * 1024) {
    ElMessage.error('文件超过 10MB 限制')
    return false
  }
  return true
}

async function handleUploadConfirm() {
  if (!uploadForm.file) return
  uploading.value = true
  try {
    const result = await uploadDataset(uploadForm.file, {
      name: uploadForm.name || undefined,
      description: uploadForm.description || undefined,
    })
    ElMessage.success(`上传成功: ${result.rowCount} 行 / ${result.columns?.length ?? 0} 列`)
    uploadVisible.value = false
    handleSearch()
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// ---------- 文件数据集: 替换数据文件 ----------
const replacing = ref(false)
const replaceFile = ref<File | null>(null)

function onReplaceFileChange(file: UploadFile) {
  if (!acceptUpload(file)) return
  replaceFile.value = (file.raw as File) ?? null
}

async function handleReplaceConfirm() {
  if (!replaceFile.value || !form.id) return
  replacing.value = true
  try {
    const result = await replaceDatasetData(form.id, replaceFile.value)
    ElMessage.success(`数据已替换: ${result.rowCount} 行 / ${result.columns?.length ?? 0} 列`)
    replaceFile.value = null
    // 刷新对话框中的文件摘要 + 列表
    form.fileData = {
      fileName: result.fileName,
      fileSize: 0,
      rowCount: result.rowCount,
      updatedAt: new Date().toISOString(),
    }
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '替换失败')
  } finally {
    replacing.value = false
  }
}

function formatFileTime(s?: string): string {
  if (!s) return '-'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN', { hour12: false })
}

// ---------- 计算字段表达式校验 ----------
async function validateExpr(row: DatasetField) {
  if (!row.expression) return
  // 可用字段 = 原始字段 (预览列) + 非计算字段别名
  const baseFields = new Set<string>(previewData.value.columns)
  for (const f of form.fields || []) {
    if (!f.computed) {
      if (f.name) baseFields.add(f.name)
      if (f.alias) baseFields.add(f.alias)
    }
  }
  try {
    const res = await validateCalcExpression(row.expression, [...baseFields])
    const r = res.data
    if (r?.valid) {
      ElMessage.success('表达式有效')
    } else {
      ElMessage.warning(r?.error || '表达式无效')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '校验请求失败')
  }
}

async function handleDelete(row: any) {
  try {
    await deleteDataset(row.id)
    ElMessage.success('删除成功')
    if (list.value.length === 1 && page.value > 1) page.value -= 1
    loadList()
  } catch {
    /* noop */
  }
}

// ---------- 行级权限 ----------
const rowPermissionVisible = ref(false)
const rowPermissionDataset = ref<{ id: number; name: string } | null>(null)

function openRowPermissions(row: any) {
  rowPermissionDataset.value = { id: row.id, name: row.name }
  rowPermissionVisible.value = true
}

// ---------- 列级权限 ----------
const columnPermissionVisible = ref(false)
const columnPermissionDataset = ref<{ id: number; name: string; fields?: unknown } | null>(null)

function openColumnPermissions(row: any) {
  columnPermissionDataset.value = { id: row.id, name: row.name, fields: row.fields }
  columnPermissionVisible.value = true
}

// ---------- 告警订阅 ----------
const alertVisible = ref(false)
const alertDataset = ref<{ id: number; name: string } | null>(null)

function openAlerts(row: any) {
  alertDataset.value = { id: row.id, name: row.name }
  alertVisible.value = true
}

// ---------- 导出 ----------
function dateStamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

async function handleExport(row: any, format: ExportFormat) {
  try {
    const blob = await exportDatasetByFormat(row.id, format, { filename: row.name })
    const safeName = String(row.name || 'dataset').replace(/[\\/:*?"<>|]/g, '_')
    saveAs(blob, `${safeName}_${dateStamp()}.${format}`)
    ElMessage.success('导出已开始')
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}

// ---------- preview ----------
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<{ columns: string[]; rows: any[]; rowCount: number }>({
  columns: [],
  rows: [],
  rowCount: 0,
})

async function previewRow(row: any) {
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = { columns: [], rows: [], rowCount: 0 }
  try {
    const res = await executeDataset(row.id, { limit: 100 })
    previewData.value = res.data || { columns: [], rows: [], rowCount: 0 }
  } finally {
    previewLoading.value = false
  }
}

/** 数据文件 tab 内的预览按钮 (对当前编辑的数据集执行 execute) */
async function previewCurrentDataset() {
  if (!form.id) return
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = { columns: [], rows: [], rowCount: 0 }
  try {
    const res = await executeDataset(form.id, { limit: 100 })
    previewData.value = res.data || { columns: [], rows: [], rowCount: 0 }
  } finally {
    previewLoading.value = false
  }
}

async function previewCurrentForm() {
  if (!form.datasourceId || !form.sql) return
  previewLoading.value = true
  previewVisible.value = true
  previewData.value = { columns: [], rows: [], rowCount: 0 }
  try {
    const res = await previewSql({ datasourceId: form.datasourceId, sql: form.sql, limit: 100 })
    previewData.value = res.data || { columns: [], rows: [], rowCount: 0 }
    ElMessage.success('SQL 校验通过')
  } finally {
    previewLoading.value = false
  }
}

onMounted(async () => {
  await loadDsOptions()
  if (!form.datasourceId && dsOptions.value[0]) form.datasourceId = dsOptions.value[0].id
  await loadList()
})
</script>

<style scoped lang="less">
.dataset-manage-page {
  width: 100%;
}
.file-meta {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 14px;
  .file-meta__row {
    display: flex;
    align-items: center;
    line-height: 26px;
    font-size: 13px;
  }
  .file-meta__label {
    width: 76px;
    color: #6b7280;
    flex-shrink: 0;
  }
}
.extract-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.page-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  .spacer {
    flex: 1;
    min-width: 4px;
  }
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}
.sql-code {
  display: block;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  background: #f9fafb;
  padding: 4px 6px;
  border-radius: 4px;
  color: #111827;
  line-height: 1.5;
  max-height: 72px;
  overflow: hidden;
}
</style>
