# 对象

---

* [discussion](#discussion)
* [post](#post)
---

### 待补充信息列表
* [discussion](#discussion) :
  * tid : 说明文本待补充
  * status : 类型与说明文本待补充
* [post](#post) :
  * votes : 类型与说明文档
  * status : 类型与说明文档

---


### discussion
* _id - MongoId // discussion 的 MongoId
* creater - MongoId // discussion 发起者的 MongoId
* title - string // 标题
* createDate - int // 创建该 discussion 的时间戳
* lastDate - int // 该 discussion 的最后一条 post 的发布时间戳
* lastMember - MongoId // 最后一位发布者的 MongoId
* views - int // 该 discussion 的点击量
* replies - int // 该 discussion 的回复数量
* tags - array\<tagName\> :
  * tagName - string // 标签的名称
* category - string // 分类的名称
* tid - int // ?
* status - ? // ?
* participants - array\<memberId\> : // 参与该 discussion 的成员列表
  * memberId - MongoId // 成员 MongoId
* posts - array\<post\> :
  * [post](#post)

### post
* user - MongoId // 成员的 MongoId
* createDate - int // 创建该 post 的时间戳
* encoding - string // 内容的编码方式
* content - string // 内容正文
* allowScript - boolean // 是否允许运行脚本
* votes - array\<?\> :
  * ? - ? // ?
* status - ? // ?
* index - int // 该 post 在其所在的 discussion 中的排序