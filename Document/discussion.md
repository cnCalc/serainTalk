# 讨论 API

---

* [添加新讨论](#添加新讨论)

---

### 添加新讨论
- port ：
  - /api/v1/discussion
- method : post
- permissions : member
- data :
  - title - string // 长度限制待补充
  - [ tags - array\<tagName\> ] :
    - tagName - string // 标签的名称
  - category - string
- result - 201 :
  - status - string : ok
  - newDiscussion - [discussion](object.md#discussion) :
    - without :
      - posts
      - participants
- error
  - 400 :
    - login first // 用户未登录