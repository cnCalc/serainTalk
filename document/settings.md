# 配置 API

* [重置配置](#重置配置)

---

## 重置 discussion 配置

使用默认的配置信息重置数据库中 discussion 部分的配置信息

<table>
  <tr>
    <td>URL</td>
    <td>/api/v1/setting/discussion/reset</td>
  </tr>
  <tr>
    <td>Method</td>
    <td>POST</td>
  </tr>
  <tr>
    <td>权限</td>
    <td>Administrator</td>
  </tr>
  <tr>
    <td>成功响应</td>
    <td>ResetDiscussionSettingSuccessResponse</td>
  </tr>
  <tr>
    <td>错误响应</td>
    <td>ResetDiscussionSettingErrorResponse</td>
  </tr>
</table>

### 相关结构
```TypeScript
interface ResetDiscussionSettingSuccessResponse {
  status: string,                                 // 请求是否成功
  setting: DiscussionCategorySetting              // 配置信息
}

interface ResetDiscussionSettingErrorResponse {
  status: string,                                 // 请求是否成功
  message: ResetDiscussionSettingErrorMessage,    // 错误信息
}

enum ResetDiscussionSettingErrorMessage {
  'server error.',                                // 500 - 服务器错误
  'permission denied.'                            // 401 - 需要管理员权限
}
```
### 引用结构
[DiscussionCategorySetting](./object.md#DiscussionCategorySetting
)