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
  creator: ObjectID,              // 创建者的 ObjectID
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
    up: Array<ObjectID>,          // 投票支持的成员列表
    down: Array<ObjectID>,        // 投票反对的成员列表
    laugh: Array<ObjectID>,       // 投票😄的成员列表
    doubt: Array<ObjectID>,       // 投票😕的成员列表
    love: Array<ObjectID>,        // 投票❤️的成员列表
    cheer: Array<ObjectID>,       // 投票🎉的成员列表
    emmmm: Array<ObjectID>,       // 投票🌚的成员列表
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

论坛成员表结构：

```TypeScript
interface Member {
  _id: ObjectID,                          // 该用户的 ID
  username: string,                       // 该用户的用户名
  email: string,                          // 该用户的邮件地址
  regip: string,                          // 该用户的注册 IP
  regdate: number,                        // 该用户的注册日期
  lastlogintime: number,                  // 该用户最近登陆日期
  avatar: string,                         // 该用户头像的 URL
  bio: string,                            // 该用户的个人简介
  device: Device,                         // 该用户的主力机型，参考下面的枚举类
  credentials: {                          // 用户的登录凭据信息
    type: CredentialType,                 // 凭据类型，参考下面的枚举类
    salt: string,                         // 密码的盐
    password: string,                     // 加盐后密码的杂凑值
  },
  notifications: Array<Notification>      // 通知队列
  ignores: {
    notification:{
      members: Array<ObjectID>,             // 忽略的用户列表（被这些用户回复时不产生通知）
      discussions: Array<ObjectID>,         // 忽略的讨论列表（该讨论内自己被回复和被提及不会产生通知）
    }
  },
  settings: {
    nightmode: bool,
    mail: {
      onReply: bool,
      onMention: bool,
      onSubscribtionUpdate: bool,
    },
    privacy: {
      showEmailToMembers: bool,
    }
  },
  uid?: number,                           // Discuz 的用户 ID
  gender?: number,                        // 性别，可能不会保留
  birthday?: number,                      // 生日三连，可能不会保留
  birthmonth?: number,
  birthyear?: number,
  qq?: string,                            // QQ 号，可能不会保留
  site?: string,                          // 个人主页，可能不会保留
}

enum Device {
  DEVICE_NSPIRE_CLICKPAD: string,
  DEVICE_NSPIRE_TOUCHPAD: string,
  DEVICE_NSPIRE_CX: string,
  DEVICE_NSPIRE_CM: string,
  DEVICE_TI_83_84: string,
  DEVICE_TI_89: string,
  DEVICE_TI_92: string,
  DEVICE_TI_92_PLUS: string,
  DEVICE_CLASSPAD_330: string,
  DEVICE_CLASSPAD_400: string,
  DEVICE_FX_9860: string,
  DEVICE_FX_9750: string,
  DEVICE_FX_CG10_20: string,
  DEVICE_FX_CG50: string,
  DEVICE_FX_5800P: string,
  DEVICE_HP_39GS: string,
  DEVICE_HP_50G: string,
  DEVICE_HP_PRIME: string,
  DEVICE_SCIENTIFIC: string,
  DEVICE_KEYSTROKE: string,
  DEVICE_OTHER: string,
}

enum CredentialType {
  CREDENTIAL_DISCUZ: string,
  CREDENTIAL_SERAIN: string,
}
```


## Attachment
TODO:

## Mail
TODO:
