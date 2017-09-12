# 对象

1. [Discussion](#Discussion)
2. [Post](#Post)
3. [DiscussionCategorySetting](#DiscussionCategorySetting)

## 待补充信息列表


## Discussion

Discussion 是论坛的每一个讨论的结构，对应 Discuz 中是帖子。

``` TypeScript
interface Discussion {
  _id: ObjectID,                  // 该讨论的 ObjectID
  creater: ObjectID,              // 创建者的 ObjectID
  title: string,                  // 该讨论的标题
  createDate: number,             // 讨论创建日期的 UNIX 时间戳
  lastDate: number,               // 讨论最后回复的日期的 UNIX 时间戳
  lastMember: ObjectID,           // 讨论最后回复者的　ObjectID
  views: number,                  // 讨论的访问次数
  replies: number,                // 讨论的回复数量
  tags: Array<string>,            // 讨论的标签
  category: string,               // 讨论的分类
  tid?: number,                   // 该讨论在 Discuz 中的 ID（Thread ID），仅对迁移前数据有效
  status: string,                 // 讨论的状态，null 或 undefined 为正常，'hidden' 为隐藏，'lock' 为锁定（不允许编辑和回复）
  participants: Array<ObjectID>,  // 参与讨论的用户列表，是否需要保留此字段待定
  posts: Array<Post>              // 帖子列表
}
```

## Post

Post 是论坛中帖子的内容结构，对应 Discuz 中是回复。

``` TypeScript
interface Post {
  index: number,                  // 楼层
  user: ObjectID,                 // 创建者 ID
  createDate: number,             // 创建日期，UNIX 时间戳
  allowScript?: boolean,          // 是否允许脚本，默认 false，undefined 看做 false
  votes: {
    vote_up: number,              // 投票支持的数量
    vote_down: number,            // 投票反对的数量
    laugh: number,                // 投票😄 的数量
    doubt: number,                // 投票😕 的数量
    love: number,                 // 投票❤️ 的数量
    cheer: number,                // 投票🎉 的数量
    emmmm: number,                // 投票🌚 的数量
  },
  status: string,                 // 状态，hidden 为隐藏，lock 为锁定（不允许编辑）
  encoding: string,               // 内容的格式，允许值为 HTML 和 Markdown，非管理员只可以选择 Markdown
  content: string,                // 内容文本
}
```

## DiscussionCategorySetting

讨论分类的分组配置结构

``` TypeScript
interface DiscussionCategorySetting {
  groups: Array<Group>
}

interface Group {
  name: string,
  items: Array<Category>
}

interface Category {
  name: string,
  type: string,
  slug: string,
  description: string,
  color: string,
  img: null
}
```

## Member
TODO

## Attachment
TODO

## Mail
TODO
