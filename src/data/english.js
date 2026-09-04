/**
 * 英语分类词库（面向 4-10 岁）
 *
 * 单条数据格式（紧凑数组）：
 * [ 单词, 音标, 中文, 插图 emoji, 例句, 例句中文 ]
 *
 * 分类依据：4-10 岁儿童生活半径内最高频的主题场景，
 * 从具体名词（动物 / 食物）逐步过渡到抽象概念（时间 / 情绪 / 动作）。
 */
const RAW = {
  animals: [
    ['cat', '/kæt/', '猫', '🐱', 'The cat is sleeping.', '这只猫在睡觉。'],
    ['dog', '/dɒɡ/', '狗', '🐶', 'My dog can run fast.', '我的小狗跑得很快。'],
    ['rabbit', '/ˈræbɪt/', '兔子', '🐰', 'The rabbit has long ears.', '这只兔子有长长的耳朵。'],
    ['bird', '/bɜːd/', '鸟', '🐦', 'A bird is singing in the tree.', '一只鸟在树上唱歌。'],
    ['fish', '/fɪʃ/', '鱼', '🐟', 'The fish swims in the water.', '鱼在水里游。'],
    ['duck', '/dʌk/', '鸭子', '🦆', 'The duck can swim.', '鸭子会游泳。'],
    ['cow', '/kaʊ/', '奶牛', '🐮', 'The cow gives us milk.', '奶牛给我们牛奶。'],
    ['pig', '/pɪɡ/', '猪', '🐷', 'The pig is pink and fat.', '这只猪又粉又胖。'],
    ['horse', '/hɔːs/', '马', '🐴', 'I can ride a horse.', '我会骑马。'],
    ['sheep', '/ʃiːp/', '绵羊', '🐑', 'The sheep is white.', '这只绵羊是白色的。'],
    ['chicken', '/ˈtʃɪkɪn/', '小鸡', '🐔', 'The chicken is small.', '这只小鸡很小。'],
    ['monkey', '/ˈmʌŋki/', '猴子', '🐵', 'The monkey likes bananas.', '猴子喜欢香蕉。'],
    ['tiger', '/ˈtaɪɡə/', '老虎', '🐯', 'The tiger is very strong.', '老虎非常强壮。'],
    ['lion', '/ˈlaɪən/', '狮子', '🦁', 'The lion is the king of animals.', '狮子是百兽之王。'],
    ['elephant', '/ˈelɪfənt/', '大象', '🐘', 'The elephant has a long nose.', '大象有长长的鼻子。'],
    ['panda', '/ˈpændə/', '熊猫', '🐼', 'The panda eats bamboo.', '熊猫吃竹子。'],
    ['bear', '/beə/', '熊', '🐻', 'The bear is big and brown.', '这只熊又大又棕。'],
    ['fox', '/fɒks/', '狐狸', '🦊', 'The fox is very clever.', '狐狸非常聪明。'],
    ['frog', '/frɒɡ/', '青蛙', '🐸', 'The frog can jump high.', '青蛙能跳得很高。'],
    ['bee', '/biː/', '蜜蜂', '🐝', 'The bee makes honey.', '蜜蜂酿蜜。'],
    ['butterfly', '/ˈbʌtəflaɪ/', '蝴蝶', '🦋', 'The butterfly is beautiful.', '这只蝴蝶很漂亮。'],
    ['mouse', '/maʊs/', '老鼠', '🐭', 'The little mouse runs away.', '小老鼠跑掉了。'],
    ['turtle', '/ˈtɜːtl/', '乌龟', '🐢', 'The turtle walks slowly.', '乌龟走得很慢。'],
    ['whale', '/weɪl/', '鲸鱼', '🐳', 'The whale is very big.', '鲸鱼非常大。']
  ],

  colors: [
    ['red', '/red/', '红色', '🔴', 'The apple is red.', '苹果是红色的。'],
    ['yellow', '/ˈjeləʊ/', '黄色', '🟡', 'The banana is yellow.', '香蕉是黄色的。'],
    ['blue', '/bluː/', '蓝色', '🔵', 'The sky is blue.', '天空是蓝色的。'],
    ['green', '/ɡriːn/', '绿色', '🟢', 'The leaves are green.', '叶子是绿色的。'],
    ['orange', '/ˈɒrɪndʒ/', '橙色', '🟠', 'I like the orange bag.', '我喜欢这个橙色的包。'],
    ['purple', '/ˈpɜːpl/', '紫色', '🟣', 'The grapes are purple.', '葡萄是紫色的。'],
    ['pink', '/pɪŋk/', '粉色', '🩷', 'She has a pink dress.', '她有一条粉色的裙子。'],
    ['black', '/blæk/', '黑色', '⚫', 'The cat is black.', '这只猫是黑色的。'],
    ['white', '/waɪt/', '白色', '⚪', 'The snow is white.', '雪是白色的。'],
    ['brown', '/braʊn/', '棕色', '🟤', 'The dog is brown.', '这只狗是棕色的。'],
    ['circle', '/ˈsɜːkl/', '圆形', '⭕', 'Draw a circle, please.', '请画一个圆形。'],
    ['square', '/skweə/', '正方形', '🟦', 'This is a square.', '这是一个正方形。'],
    ['triangle', '/ˈtraɪæŋɡl/', '三角形', '🔺', 'A triangle has three sides.', '三角形有三条边。'],
    ['star', '/stɑː/', '星形', '⭐', 'The star is shining.', '星星在闪耀。'],
    ['heart', '/hɑːt/', '心形', '❤️', 'I draw a heart for you.', '我为你画一颗心。'],
    ['big', '/bɪɡ/', '大的', '🐘', 'The elephant is very big.', '大象非常大。'],
    ['small', '/smɔːl/', '小的', '🐜', 'The ant is very small.', '蚂蚁非常小。']
  ],

  food: [
    ['apple', '/ˈæpl/', '苹果', '🍎', 'I eat an apple every day.', '我每天吃一个苹果。'],
    ['banana', '/bəˈnɑːnə/', '香蕉', '🍌', 'The monkey likes bananas.', '猴子喜欢香蕉。'],
    ['orange', '/ˈɒrɪndʒ/', '橘子', '🍊', 'This orange is sweet.', '这个橘子很甜。'],
    ['grape', '/ɡreɪp/', '葡萄', '🍇', 'I like purple grapes.', '我喜欢紫葡萄。'],
    ['strawberry', '/ˈstrɔːbəri/', '草莓', '🍓', 'The strawberry is red.', '草莓是红色的。'],
    ['watermelon', '/ˈwɔːtəmelən/', '西瓜', '🍉', 'Watermelon is cool in summer.', '夏天吃西瓜很凉快。'],
    ['peach', '/piːtʃ/', '桃子', '🍑', 'This peach is very sweet.', '这个桃子很甜。'],
    ['pear', '/peə/', '梨', '🍐', 'I want a pear.', '我想要一个梨。'],
    ['bread', '/bred/', '面包', '🍞', 'I have bread for breakfast.', '我早餐吃面包。'],
    ['cake', '/keɪk/', '蛋糕', '🎂', 'Happy birthday! Here is your cake.', '生日快乐！这是你的蛋糕。'],
    ['milk', '/mɪlk/', '牛奶', '🥛', 'I drink milk every morning.', '我每天早上喝牛奶。'],
    ['egg', '/eɡ/', '鸡蛋', '🥚', 'I eat one egg every day.', '我每天吃一个鸡蛋。'],
    ['rice', '/raɪs/', '米饭', '🍚', 'We eat rice for lunch.', '我们午饭吃米饭。'],
    ['noodle', '/ˈnuːdl/', '面条', '🍜', 'I love noodles.', '我喜欢吃面条。'],
    ['meat', '/miːt/', '肉', '🍖', 'The cat likes meat.', '猫喜欢吃肉。'],
    ['fish', '/fɪʃ/', '鱼肉', '🐟', 'Fish is good for you.', '鱼肉对你有好处。'],
    ['vegetable', '/ˈvedʒtəbl/', '蔬菜', '🥬', 'Eat more vegetables.', '多吃蔬菜。'],
    ['soup', '/suːp/', '汤', '🍲', 'The soup is hot.', '汤很烫。'],
    ['water', '/ˈwɔːtə/', '水', '💧', 'Please drink more water.', '请多喝水。'],
    ['juice', '/dʒuːs/', '果汁', '🧃', 'I want some apple juice.', '我想要一些苹果汁。'],
    ['candy', '/ˈkændi/', '糖果', '🍬', 'Too much candy is not good.', '吃太多糖果不好。'],
    ['cookie', '/ˈkʊki/', '饼干', '🍪', 'Have a cookie!', '吃块饼干吧！'],
    ['ice cream', '/aɪs kriːm/', '冰淇淋', '🍦', 'Ice cream is cold and sweet.', '冰淇淋又凉又甜。'],
    ['hamburger', '/ˈhæmbɜːɡə/', '汉堡', '🍔', 'He is eating a hamburger.', '他正在吃汉堡。']
  ],

  numbers: [
    ['one', '/wʌn/', '一', '1️⃣', 'I have one nose.', '我有一个鼻子。'],
    ['two', '/tuː/', '二', '2️⃣', 'I have two eyes.', '我有两只眼睛。'],
    ['three', '/θriː/', '三', '3️⃣', 'There are three apples.', '有三个苹果。'],
    ['four', '/fɔː/', '四', '4️⃣', 'A cat has four legs.', '猫有四条腿。'],
    ['five', '/faɪv/', '五', '5️⃣', 'One hand has five fingers.', '一只手有五根手指。'],
    ['six', '/sɪks/', '六', '6️⃣', 'I get up at six.', '我六点起床。'],
    ['seven', '/ˈsevn/', '七', '7️⃣', 'A week has seven days.', '一周有七天。'],
    ['eight', '/eɪt/', '八', '8️⃣', 'The spider has eight legs.', '蜘蛛有八条腿。'],
    ['nine', '/naɪn/', '九', '9️⃣', 'Nine and one is ten.', '九加一等于十。'],
    ['ten', '/ten/', '十', '🔟', 'I have ten crayons.', '我有十支蜡笔。'],
    ['first', '/fɜːst/', '第一', '🥇', 'I am the first one.', '我是第一个。'],
    ['second', '/ˈsekənd/', '第二', '🥈', 'He is the second one.', '他是第二个。'],
    ['half', '/hɑːf/', '一半', '◐', 'Cut the apple in half.', '把苹果切成两半。'],
    ['many', '/ˈmeni/', '许多', '🔢', 'There are many stars.', '有很多星星。'],
    ['few', '/fjuː/', '少数', '🔽', 'I have a few books.', '我有几本书。'],
    ['more', '/mɔː/', '更多', '➕', 'I want more water.', '我想要更多水。']
  ],

  body: [
    ['head', '/hed/', '头', '🧠', 'Put your hands on your head.', '把手放在头上。'],
    ['eye', '/aɪ/', '眼睛', '👁️', 'Close your eyes.', '闭上眼睛。'],
    ['ear', '/ɪə/', '耳朵', '👂', 'The rabbit has long ears.', '兔子有长耳朵。'],
    ['nose', '/nəʊz/', '鼻子', '👃', 'The elephant has a long nose.', '大象有长鼻子。'],
    ['mouth', '/maʊθ/', '嘴巴', '👄', 'Open your mouth.', '张开嘴巴。'],
    ['tooth', '/tuːθ/', '牙齿', '🦷', 'Brush your teeth every day.', '每天都要刷牙。'],
    ['hair', '/heə/', '头发', '💇', 'She has long black hair.', '她有长长的黑头发。'],
    ['hand', '/hænd/', '手', '✋', 'Wash your hands before you eat.', '吃饭前要洗手。'],
    ['finger', '/ˈfɪŋɡə/', '手指', '👆', 'I have ten fingers.', '我有十根手指。'],
    ['arm', '/ɑːm/', '手臂', '💪', 'Wave your arms.', '挥一挥手臂。'],
    ['leg', '/leɡ/', '腿', '🦵', 'My legs are strong.', '我的腿很强壮。'],
    ['foot', '/fʊt/', '脚', '🦶', 'My foot hurts.', '我的脚疼。'],
    ['knee', '/niː/', '膝盖', '🦿', 'He fell down and hurt his knee.', '他摔倒了，磕到了膝盖。'],
    ['face', '/feɪs/', '脸', '😊', 'Wash your face.', '洗洗脸。'],
    ['heart', '/hɑːt/', '心脏', '❤️', 'My heart beats fast.', '我的心跳得很快。'],
    ['body', '/ˈbɒdi/', '身体', '🧍', 'Take care of your body.', '照顾好你的身体。']
  ],

  family: [
    ['father', '/ˈfɑːðə/', '爸爸', '👨', 'My father is tall.', '我的爸爸很高。'],
    ['mother', '/ˈmʌðə/', '妈妈', '👩', 'My mother is kind.', '我的妈妈很温柔。'],
    ['dad', '/dæd/', '爸爸（口语）', '👨', 'I love my dad.', '我爱我的爸爸。'],
    ['mom', '/mɒm/', '妈妈（口语）', '👩', 'Mom, I am home!', '妈妈，我回来了！'],
    ['brother', '/ˈbrʌðə/', '哥哥 / 弟弟', '👦', 'My brother is six years old.', '我弟弟六岁了。'],
    ['sister', '/ˈsɪstə/', '姐姐 / 妹妹', '👧', 'My sister likes drawing.', '我姐姐喜欢画画。'],
    ['grandpa', '/ˈɡrænpɑː/', '爷爷 / 外公', '👴', 'Grandpa likes tea.', '爷爷喜欢喝茶。'],
    ['grandma', '/ˈɡrænmɑː/', '奶奶 / 外婆', '👵', 'Grandma tells me stories.', '奶奶给我讲故事。'],
    ['baby', '/ˈbeɪbi/', '宝宝', '👶', 'The baby is sleeping.', '宝宝在睡觉。'],
    ['family', '/ˈfæməli/', '家庭', '👨‍👩‍👧', 'I love my family.', '我爱我的家。'],
    ['friend', '/frend/', '朋友', '🧑‍🤝‍🧑', 'She is my best friend.', '她是我最好的朋友。'],
    ['teacher', '/ˈtiːtʃə/', '老师', '👩‍🏫', 'My teacher is very nice.', '我的老师非常好。']
  ],

  school: [
    ['book', '/bʊk/', '书', '📖', 'I am reading a book.', '我正在读一本书。'],
    ['pen', '/pen/', '钢笔', '🖊️', 'I write with a pen.', '我用钢笔写字。'],
    ['pencil', '/ˈpensl/', '铅笔', '✏️', 'This is my new pencil.', '这是我的新铅笔。'],
    ['eraser', '/ɪˈreɪzə/', '橡皮', '🧽', 'Can I use your eraser?', '我能用一下你的橡皮吗？'],
    ['ruler', '/ˈruːlə/', '尺子', '📏', 'Draw a line with a ruler.', '用尺子画一条线。'],
    ['bag', '/bæɡ/', '书包', '🎒', 'My bag is heavy.', '我的书包很重。'],
    ['desk', '/desk/', '书桌', '🪑', 'Put your book on the desk.', '把书放在书桌上。'],
    ['chair', '/tʃeə/', '椅子', '💺', 'Sit on the chair.', '坐在椅子上。'],
    ['paper', '/ˈpeɪpə/', '纸', '📄', 'Give me a piece of paper.', '给我一张纸。'],
    ['crayon', '/ˈkreɪɒn/', '蜡笔', '🖍️', 'I draw with crayons.', '我用蜡笔画画。'],
    ['school', '/skuːl/', '学校', '🏫', 'I go to school every day.', '我每天去上学。'],
    ['classroom', '/ˈklɑːsruːm/', '教室', '🏫', 'Our classroom is big.', '我们的教室很大。'],
    ['letter', '/ˈletə/', '字母', '🔤', 'How many letters are there?', '有多少个字母？'],
    ['word', '/wɜːd/', '单词', '🔠', 'This word is easy.', '这个单词很简单。'],
    ['number', '/ˈnʌmbə/', '数字', '🔢', 'Write the number five.', '写下数字五。'],
    ['homework', '/ˈhəʊmwɜːk/', '作业', '📝', 'I do my homework after school.', '放学后我写作业。']
  ],

  nature: [
    ['sun', '/sʌn/', '太阳', '☀️', 'The sun is hot.', '太阳很热。'],
    ['moon', '/muːn/', '月亮', '🌙', 'The moon is bright tonight.', '今晚的月亮很亮。'],
    ['star', '/stɑː/', '星星', '⭐', 'I can see many stars.', '我能看见很多星星。'],
    ['cloud', '/klaʊd/', '云', '☁️', 'The cloud is white.', '云是白色的。'],
    ['rain', '/reɪn/', '雨', '🌧️', 'I like the sound of rain.', '我喜欢下雨的声音。'],
    ['snow', '/snəʊ/', '雪', '❄️', 'Snow is cold and white.', '雪又冷又白。'],
    ['wind', '/wɪnd/', '风', '🌬️', 'The wind is blowing.', '风在吹。'],
    ['tree', '/triː/', '树', '🌳', 'There is a big tree.', '有一棵大树。'],
    ['flower', '/ˈflaʊə/', '花', '🌸', 'This flower is beautiful.', '这朵花很漂亮。'],
    ['grass', '/ɡrɑːs/', '草', '🌿', 'Do not walk on the grass.', '不要踩草地。'],
    ['mountain', '/ˈmaʊntən/', '山', '⛰️', 'The mountain is very high.', '这座山很高。'],
    ['river', '/ˈrɪvə/', '河流', '🏞️', 'The river is long.', '这条河很长。'],
    ['sea', '/siː/', '大海', '🌊', 'The sea is blue.', '大海是蓝色的。'],
    ['sky', '/skaɪ/', '天空', '🌌', 'The sky is clear today.', '今天天空很晴朗。'],
    ['spring', '/sprɪŋ/', '春天', '🌸', 'Spring is warm.', '春天很温暖。'],
    ['winter', '/ˈwɪntə/', '冬天', '⛄', 'Winter is cold.', '冬天很冷。']
  ],

  actions: [
    ['run', '/rʌn/', '跑', '🏃', 'I can run very fast.', '我能跑得很快。'],
    ['jump', '/dʒʌmp/', '跳', '🤸', 'The rabbit can jump high.', '兔子能跳得很高。'],
    ['walk', '/wɔːk/', '走', '🚶', 'Let us walk together.', '我们一起走吧。'],
    ['swim', '/swɪm/', '游泳', '🏊', 'Can you swim?', '你会游泳吗？'],
    ['sing', '/sɪŋ/', '唱歌', '🎤', 'We sing a happy song.', '我们唱一首快乐的歌。'],
    ['dance', '/dɑːns/', '跳舞', '💃', 'She can dance very well.', '她跳舞跳得很好。'],
    ['read', '/riːd/', '读', '📖', 'I read books every night.', '我每晚都读书。'],
    ['write', '/raɪt/', '写', '✍️', 'I write my name.', '我写我的名字。'],
    ['draw', '/drɔː/', '画', '🎨', 'Let us draw a cat.', '我们画一只猫吧。'],
    ['eat', '/iːt/', '吃', '🍽️', 'Time to eat dinner.', '该吃晚饭了。'],
    ['drink', '/drɪŋk/', '喝', '🥤', 'I drink a lot of water.', '我喝很多水。'],
    ['sleep', '/sliːp/', '睡觉', '😴', 'The baby is sleeping.', '宝宝正在睡觉。'],
    ['play', '/pleɪ/', '玩', '🧸', 'Let us play together.', '我们一起玩吧。'],
    ['listen', '/ˈlɪsn/', '听', '👂', 'Listen to the music.', '听听音乐。'],
    ['happy', '/ˈhæpi/', '开心的', '😊', 'I am happy today.', '我今天很开心。'],
    ['smile', '/smaɪl/', '微笑', '🙂', 'Smile, please!', '笑一个！']
  ],

  home: [
    ['house', '/haʊs/', '房子', '🏠', 'My house is near the park.', '我家在公园附近。'],
    ['room', '/ruːm/', '房间', '🚪', 'This is my room.', '这是我的房间。'],
    ['bed', '/bed/', '床', '🛏️', 'I sleep in my bed.', '我在床上睡觉。'],
    ['door', '/dɔː/', '门', '🚪', 'Please close the door.', '请关门。'],
    ['window', '/ˈwɪndəʊ/', '窗户', '🪟', 'Open the window, please.', '请打开窗户。'],
    ['table', '/ˈteɪbl/', '桌子', '🪑', 'Put the cup on the table.', '把杯子放在桌上。'],
    ['lamp', '/læmp/', '台灯', '💡', 'Turn on the lamp.', '把台灯打开。'],
    ['clock', '/klɒk/', '时钟', '⏰', 'The clock is on the wall.', '时钟在墙上。'],
    ['cup', '/kʌp/', '杯子', '🥤', 'This cup is mine.', '这个杯子是我的。'],
    ['bowl', '/bəʊl/', '碗', '🥣', 'I want a bowl of rice.', '我想要一碗米饭。'],
    ['toy', '/tɔɪ/', '玩具', '🧸', 'Put your toys away.', '把玩具收好。'],
    ['ball', '/bɔːl/', '球', '⚽', 'Let us play with the ball.', '我们玩球吧。'],
    ['shoe', '/ʃuː/', '鞋子', '👟', 'Put on your shoes.', '穿上鞋子。'],
    ['hat', '/hæt/', '帽子', '🧢', 'Take off your hat.', '把帽子摘下来。'],
    ['key', '/kiː/', '钥匙', '🔑', 'I lost my key.', '我把钥匙弄丢了。'],
    ['phone', '/fəʊn/', '电话', '📱', 'The phone is ringing.', '电话响了。']
  ]
}

const CATEGORY_META = {
  animals: { id: 'animals', name: '动物朋友', emoji: '🐼', color: '#95E1A3', age: '4-6 岁', desc: '认识 24 种常见动物' },
  colors: { id: 'colors', name: '颜色形状', emoji: '🎨', color: '#FF6B9D', age: '4-6 岁', desc: '颜色与基本形状' },
  food: { id: 'food', name: '美味食物', emoji: '🍎', color: '#FF8A3D', age: '4-7 岁', desc: '水果、主食与饮品' },
  numbers: { id: 'numbers', name: '数字数学', emoji: '🔢', color: '#4ECDC4', age: '4-7 岁', desc: '1-10 与数量概念' },
  body: { id: 'body', name: '我的身体', emoji: '🖐️', color: '#FFA94D', age: '5-8 岁', desc: '身体部位名称' },
  family: { id: 'family', name: '我的家人', emoji: '👨‍👩‍👧', color: '#FF8787', age: '5-8 岁', desc: '家庭成员与称谓' },
  school: { id: 'school', name: '学校用品', emoji: '🎒', color: '#748FFC', age: '6-9 岁', desc: '文具与校园场景' },
  nature: { id: 'nature', name: '大自然', emoji: '🌈', color: '#63E6BE', age: '6-9 岁', desc: '天气、植物与四季' },
  actions: { id: 'actions', name: '动作情绪', emoji: '🏃', color: '#A78BFA', age: '7-10 岁', desc: '常见动词与情绪词' },
  home: { id: 'home', name: '我的家', emoji: '🏠', color: '#F783AC', age: '7-10 岁', desc: '家居物品名称' }
}

function normalize(raw, catId) {
  return raw.map((item, index) => ({
    id: `${catId}-${index}`,
    cat: catId,
    word: item[0],
    ipa: item[1],
    zh: item[2],
    emoji: item[3],
    sentence: item[4],
    sentenceZh: item[5]
  }))
}

export const EN_CATEGORIES = Object.keys(RAW).map((id) => ({
  ...CATEGORY_META[id],
  items: normalize(RAW[id], id)
}))

export const EN_ALL = EN_CATEGORIES.flatMap((c) => c.items)

export function getEnCategory(catId) {
  return EN_CATEGORIES.find((c) => c.id === catId) || EN_CATEGORIES[0]
}
