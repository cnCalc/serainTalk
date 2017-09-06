# 讨论 API

* [添加讨论](#添加讨论)
* [删除讨论](#删除讨论)
* [修改讨论](#修改讨论)

---

## 添加讨论

创建一个新的讨论，需要首个 Post 的内容。

<table>
  <tr>
    <td>URL</td>
    <td>/api/v1/discussion</td>
  </tr>
  <tr>
    <td>Method</td>
    <td>POST</td>
  </tr>
  <tr>
    <td>权限</td>
    <td>Member, Administrator</td>
  </tr>
  <tr>
    <td>数据</td>
    <td>CreateDiscussionRequest</td>
  </tr>
  <tr>
    <td>成功响应</td>
    <td>CreateDiscussionSuccessResponse</td>
  </tr>
  <tr>
    <td>错误响应</td>
    <td>CreateDiscussionErrorResponse</td>
  </tr>
</table>

### 相关结构
```TypeScript
interface CreateDiscussionRequest {
  title: string,
  tags: Array<string>,
  category: string,
  content: {
    encoding: string,
    content: string,
  }
}

interface CreateDiscussionSuccessResponse {
  status: string,
  discussion: Discussion,
}

enum CreateDiscussionErrorMessage {
  ERR_REQUIRE_LOGIN: string,
  ERR_ACCOUNT_BLOCKED: string,
  ERR_IP_BLOCKED: string,
  ERR_SERVER_FAIL: string,
}

interface CreateDiscussionErrorResponse {
  status: string,
  message: CreateDiscussionErrorMessage,
}
```

## 删除讨论

对于普通用户，讨论只有在 Post 长度为 0 时才可以删除，即刚创建完后，可以删除首贴，再删除讨论。对于已有回复的讨论，用户就不可以再删除。

管理员可以再任意时刻删除一个讨论串，但是更加建议管理员将该讨论隐藏或移动至不可见分区（机要处等），以便恢复。

// TODO

## 修改讨论

讨论只可以被管理员或创建者修改，可以修改的字段仅有讨论标题，分类和标签（是否需要开放标签编辑权限呢？）。