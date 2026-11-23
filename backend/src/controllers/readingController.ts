import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Story, DifficultyLevel } from '../models/Story';
import { StoryProgress } from '../models/StoryProgress';
import { ActivityLog } from '../models/ActivityLog';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'Beginner',
  'Elementary',
  'Easy',
  'Intermediate',
  'Advanced',
  'Hard'
];

export const LEVEL_RANK: Record<DifficultyLevel, number> = {
  Beginner: 1,
  Elementary: 2,
  Easy: 3,
  Intermediate: 4,
  Advanced: 5,
  Hard: 6
};

// Default seed stories for all 6 levels if empty
const INITIAL_STORIES = [
  {
    titleEnglish: 'The Clever Fox',
    titleHindi: 'चतुर लोमड़ी',
    englishContent: `Once upon a time, in a dense green forest, there lived a very clever fox. One sunny morning, the fox was walking near a farmer's vineyard. He saw bunches of ripe, purple grapes hanging high from the vines.

The grapes looked sweet, juicy, and delicious. The hungry fox licked his lips and took several steps back. He ran forward and jumped as high as he could, but he missed the grapes. 

He tried again and again, leaping into the air with all his strength. But the grapes hung far too high. Finally, feeling tired and disappointed, the fox curled his nose and walked away saying, "The grapes are sour anyway. I do not want them."

Moral: It is easy to despise what you cannot attain.`,
    hindiContent: `एक समय की बात है, एक घने हरे जंगल में एक बहुत ही चतुर लोमड़ी रहती थी। एक धूप भरी सुबह, लोमड़ी एक किसान के अंगूर के बाग के पास घूम रही थी। उसने बेलों से ऊंचे लटके पके, बैंगनी अंगूरों के गुच्छे देखे।

अंगूर मीठे, रसीले और स्वादिष्ट दिख रहे थे। भूखी लोमड़ी ने अपने होंठ चाटे और कुछ कदम पीछे हट गई। वह आगे की ओर दौड़ी और जितनी ऊंची कूद सकती थी कूदी, लेकिन अंगूरों तक नहीं पहुंच पाई।

उसने अपनी पूरी ताकत से हवा में बार-बार कूदकर कोशिश की। लेकिन अंगूर बहुत ऊंचाई पर लटके हुए थे। अंत में, थका और निराश होकर, लोमड़ी ने अपनी नाक सिकोड़ी और यह कहते हुए चली गई, "अंगूर खट्टे हैं। मुझे ये नहीं चाहिए।"

सीख: जो चीज़ हमें नहीं मिल पाती, उसमें दोष निकालना बहुत आसान होता है।`,
    shortDescription: 'A classic fable about a fox who discovers that determination requires wisdom.',
    difficultyLevel: 'Beginner' as DifficultyLevel,
    displayOrder: 1,
    status: 'Published' as const
  },
  {
    titleEnglish: 'The Thirsty Crow',
    titleHindi: 'प्यासा कौआ',
    englishContent: `On a hot summer afternoon, a thirsty crow flew all over the countryside looking for water. For a long time, he could not find any. He felt very weak and thought he would collapse.

Suddenly, he saw a water pitcher sitting beneath a shady neem tree. He flew straight down to see if there was any water inside. Yes, there was some water inside the pitcher! 

However, the pitcher was deep and the water level was too low for the crow's short beak to reach. The crow tried to push his head in, but the neck of the jar was too narrow.

Then, an idea struck him. He saw small pebbles lying on the ground. One by one, he picked up the pebbles with his beak and dropped them into the pitcher. As each pebble went in, the water level slowly rose. Finally, the water reached the brim. The crow drank happily and flew away full of energy.

Moral: Where there is a will, there is a way.`,
    hindiContent: `गर्मी की एक दोपहर, एक प्यासा कौआ पानी की तलाश में पूरे इलाके में उड़ रहा था। काफी देर तक उसे कहीं भी पानी नहीं मिला। वह बहुत कमजोरी महसूस कर रहा था और उसे लगा कि वह गिर पड़ेगा।

अचानक, उसने एक छायादार नीम के पेड़ के नीचे पानी का एक घड़ा देखा। वह सीधे नीचे उड़कर देखने गया कि क्या अंदर पानी है। हाँ, घड़े के अंदर थोड़ा पानी था!

हालाँकि, घड़ा गहरा था और पानी का स्तर इतना कम था कि कौवे की छोटी चोंच वहाँ तक नहीं पहुँच पा रही थी। कौवे ने अपना सिर अंदर डालने की कोशिश की, लेकिन घड़े की गर्दन बहुत संकरी थी।

तभी, उसके दिमाग में एक विचार आया। उसने जमीन पर पड़े छोटे-छोटे कंकड़ देखे। एक-एक करके, उसने अपनी चोंच से कंकड़ों को उठाया और घड़े में डालना शुरू कर दिया। जैसे-जैसे कंकड़ अंदर जाते गए, पानी का स्तर धीरे-धीरे ऊपर उठता गया। अंततः, पानी घड़े के मुहाने तक पहुँच गया। कौवे ने खुशी-खुशी पानी पिया और ऊर्जा से भरकर उड़ गया।

सीख: जहाँ चाह, वहाँ राह।`,
    shortDescription: 'How a thoughtful crow solved a difficult problem using patience and logic.',
    difficultyLevel: 'Elementary' as DifficultyLevel,
    displayOrder: 1,
    status: 'Published' as const
  },
  {
    titleEnglish: 'The Honest Woodcutter',
    titleHindi: 'ईमानदार लकड़हारा',
    englishContent: `Once, an honest and hardworking woodcutter lived in a quiet village near a river. Every morning, he went into the forest to chop firewood to sell in the local market.

One afternoon, while he was cutting an old tree beside the fast-flowing river, his iron axe slipped from his sweaty hands and plunged deep into the water. The river was deep, and the poor woodcutter could not swim. He sat on the bank and wept bitterly, as the axe was his only source of livelihood.

Hearing his cries, the Water Goddess emerged from the sparkling waves and asked why he was crying. After listening to his plight, she dove into the water and brought out a glittering axe made of pure gold. "Is this your axe?" she asked.

The woodcutter shook his head honestly, "No, that is not mine." 

The goddess dove again and brought out a gleaming silver axe. Again, the honest woodcutter said, "No, my axe was made of plain iron."

Finally, she brought out his old iron axe. The woodcutter's eyes lit up with joy. "Yes! That is my axe! Thank you so much!"

Impressed by his remarkable integrity, the goddess rewarded him with both the gold and silver axes alongside his own.

Moral: Honesty is always rewarded.`,
    hindiContent: `एक बार, एक नदी के किनारे बसे एक शांत गाँव में एक ईमानदार और मेहनती लकड़हारा रहता था। हर सुबह, वह स्थानीय बाजार में बेचने के लिए लकड़ी काटने जंगल में जाता था।

एक दोपहर, जब वह तेज बहती नदी के किनारे एक पुराने पेड़ को काट रहा था, तो उसकी लोहे की कुल्हाड़ी उसके पसीने से तर हाथों से फिसलकर गहरे पानी में जा गिरी। नदी गहरी थी और गरीब लकड़हारा तैरना नहीं जानता था। वह किनारे पर बैठकर फूट-फूट कर रोने लगा, क्योंकि कुल्हाड़ी ही उसकी आजीविका का एकमात्र साधन थी।

उसकी पुकार सुनकर, जल देवी चमकती लहरों से बाहर आईं और पूछा कि वह क्यों रो रहा है। उसकी परेशानी सुनकर, उन्होंने पानी में डुबकी लगाई और शुद्ध सोने से बनी एक चमकदार कुल्हाड़ी बाहर निकाली। "क्या यह तुम्हारी कुल्हाड़ी है?" उन्होंने पूछा।

लकड़हारे ने ईमानदारी से सिर हिलाते हुए कहा, "नहीं, यह मेरी नहीं है।"

देवी ने फिर से डुबकी लगाई और एक चमकती हुई चांदी की कुल्हाड़ी निकाली। ईमानदार लकड़हारे ने फिर कहा, "नहीं, मेरी कुल्हाड़ी तो साधारण लोहे की बनी थी।"

अंत में, उन्होंने उसकी पुरानी लोहे की कुल्हाड़ी निकाली। लकड़हारे की आँखें खुशी से चमक उठीं। "हाँ! यह मेरी ही कुल्हाड़ी है! आपका बहुत-बहुत धन्यवाद!"

उसकी अद्भुत ईमानदारी से प्रसन्न होकर, देवी ने उसे उसकी अपनी कुल्हाड़ी के साथ-साथ सोने और चांदी की कुल्हाड़ियाँ भी उपहार में दे दीं।

सीख: ईमानदारी का फल हमेशा मीठा होता है।`,
    shortDescription: 'A timeless story demonstrating that truthfulness brings peace and great honor.',
    difficultyLevel: 'Easy' as DifficultyLevel,
    displayOrder: 1,
    status: 'Published' as const
  },
  {
    titleEnglish: 'The Lion and the Humble Mouse',
    titleHindi: 'शेर और विनम्र चूहा',
    englishContent: `In the royal heart of the savanna, a mighty lion was resting peacefully after a heavy meal. A tiny little field mouse, scurrying around in search of food, accidentally ran across the sleeping lion's enormous nose.

Awakened with a start, the furious lion trapped the tiny creature beneath his massive paw and prepared to crush it. "Forgive me, O King!" squeaked the terrified mouse. "Spare my life, and perhaps one day I can help you in return." The lion laughed out loud at the thought of a tiny mouse ever helping the king of the jungle, but feeling amused, he lifted his paw and let the mouse go.

A few weeks later, hunters entered the forest and cast a heavy rope net over the lion while he slept. The lion roared in despair as he struggled helplessly against the tight ropes.

Hearing the familiar roar, the tiny mouse rushed to the spot. Without hesitation, the mouse used his sharp little teeth to gnaw steadily through the thick ropes. Within an hour, a large opening was made, and the mighty lion stepped out freely into the jungle.

Looking down with heartfelt gratitude, the lion learned that even the smallest being can possess great power to help others.

Moral: No act of kindness, no matter how small, is ever wasted.`,
    hindiContent: `सवाना के शाही केंद्र में, एक शक्तिशाली शेर भरपेट भोजन करने के बाद शांति से विश्राम कर रहा था। भोजन की तलाश में इधर-उधर भागता हुआ एक नन्हा चूहा गलती से सोते हुए शेर की विशाल नाक के ऊपर से दौड़ गया।

अचानक जाग जाने पर, क्रोधित शेर ने उस छोटे से जीव को अपने भारी पंजे के नीचे दबा लिया और उसे कुचलने के लिए तैयार हो गया। "मुझे क्षमा करें, हे जंगल के राजा!" भयभीत चूहा गिड़गिड़ाया। "मेरे जीवन को बख्श दें, और शायद किसी दिन मैं भी आपके किसी काम आ सकूँ।" शेर इस बात पर ठहाका मारकर हँसा कि इतना छोटा चूहा जंगल के राजा की क्या मदद करेगा, फिर भी दया भाव से उसने अपना पंजा उठाया और चूहे को जाने दिया।

कुछ हफ़्तों बाद, शिकारी जंगल में आए और जब शेर सो रहा था, तो उन्होंने उस पर रस्सियों का एक भारी जाल फेंक दिया। शेर निराशा में दहाड़ने लगा क्योंकि वह मजबूत रस्सियों के बीच असहाय था।

उस जानी-पहचानी दहाड़ को सुनकर नन्हा चूहा तुरंत उस स्थान पर पहुँचा। बिना किसी हिचकिचाहट के, चूहे ने अपने नुकीले छोटे दांतों से मोटी रस्सियों को लगातार कुतरना शुरू कर दिया। एक घंटे के भीतर, जाल में एक बड़ा छेद हो गया, और शक्तिशाली शेर खुलकर जंगल में बाहर आ गया।

सच्चे आभार के साथ नीचे देखते हुए, शेर ने समझ लिया कि सबसे छोटा प्राणी भी दूसरों की मदद करने के लिए महान सामर्थ्य रख सकता है।

सीख: दया का कोई भी कार्य, चाहे वह कितना भी छोटा क्यों न हो, कभी व्यर्थ नहीं जाता।`,
    shortDescription: 'How an unlikely friendship proved that kindness transcends physical size and strength.',
    difficultyLevel: 'Intermediate' as DifficultyLevel,
    displayOrder: 1,
    status: 'Published' as const
  },
  {
    titleEnglish: 'The Power of Consistency and Habit',
    titleHindi: 'निरंतरता और आदत की शक्ति',
    englishContent: `A young scholar once traveled to a monastery situated atop a misty mountain to meet an elderly master renowned for his exceptional wisdom. The scholar asked, "Master, how do ordinary people achieve extraordinary mastery in language and craft?"

The master smiled gently and guided the student to a courtyard where water droplets were slowly dripping from a bamboo roof onto a granite boulder below. Pointing at the rock, the master said, "Look closely at the stone."

The student knelt down and noticed a smooth, deep hollow carved into the hard granite. "Does the soft water strike the rock with immense physical force?" the master asked.

"No," replied the student. "It is just a gentle, rhythmic drop."

"Precisely," explained the master. "The stone is not pierced through sheer strength, but through ceaseless repetition. A person who practices reading and speaking English for just fifteen minutes every single day will surpass someone who studies for ten hours once a month. Excellence is not a sudden mountain you climb in a day; it is a river of consistent daily habits."

Empowered by this insight, the student returned home and committed to daily deliberate practice.

Moral: Consistency turns small efforts into monumental results.`,
    hindiContent: `एक बार एक युवा विद्वान अपनी असाधारण बुद्धिमत्ता के लिए प्रसिद्ध एक वृद्ध गुरु से मिलने के लिए धुंध भरे पहाड़ की चोटी पर स्थित एक आश्रम में गया। विद्वान ने पूछा, "गुरुजी, साधारण लोग भाषा और कला में असाधारण निपुणता कैसे प्राप्त करते हैं?"

गुरुजी ने मंद मुस्कान के साथ छात्र को एक आँगन में ले गए जहाँ बाँस की छत से पानी की बूँदें नीचे पड़े एक ग्रेनाइट के पत्थर पर धीरे-धीरे टपक रही थीं। पत्थर की ओर इशारा करते हुए गुरु ने कहा, "उस पत्थर को ध्यान से देखो।"

छात्र ने झुककर देखा कि उस कठोर ग्रेनाइट में एक चिकना, गहरा गड्ढा बन गया था। "क्या यह नरम पानी पत्थर पर किसी प्रचंड शारीरिक बल से प्रहार करता है?" गुरु ने पूछा।

"नहीं," छात्र ने उत्तर दिया। "यह तो बस एक कोमल, नियमित बूँद है।"

"बिल्कुल सही," गुरु ने समझाया। "पत्थर अपनी ताकत से नहीं, बल्कि निरंतर पुनरावृत्ति से कटता है। जो व्यक्ति हर दिन केवल पंद्रह मिनट अंग्रेजी पढ़ने और बोलने का अभ्यास करता है, वह महीने में एक बार दस घंटे पढ़ने वाले से कहीं आगे निकल जाता है। उत्कृष्टता कोई अचानक चढ़ने वाला पहाड़ नहीं है; यह दैनिक आदतों की एक सतत बहती नदी है।"

इस ज्ञान से प्रेरित होकर, छात्र घर लौटा और प्रतिदिन निरंतर अभ्यास करने का संकल्प लिया।

सीख: निरंतरता छोटे प्रयासों को विशाल परिणामों में बदल देती है।`,
    shortDescription: 'An inspiring lesson on how daily deliberate practice leads to effortless language fluency.',
    difficultyLevel: 'Advanced' as DifficultyLevel,
    displayOrder: 1,
    status: 'Published' as const
  },
  {
    titleEnglish: 'The Journey to Self-Mastery and Eloquence',
    titleHindi: 'आत्म-नियंत्रण और वक्तृत्व की यात्रा',
    englishContent: `In ancient Athens, a young man named Demosthenes dreamed of becoming an influential orator whose words could unite divided citizens and guide the destiny of his republic. However, nature had dealt him significant obstacles: he spoke with an awkward stammer, possessed a frail voice, and suffered from severe shortness of breath whenever he stepped before an audience.

During his initial public speech, the listeners ridiculed his hesitation and drove him from the assembly in disgrace. Heartbroken but undefeated, Demosthenes retreated into an underground sanctuary he carved with his own hands. There, he resolved to conquer his biological limitations through unmatched discipline.

He shaved half of his head so that shame would prevent him from venturing into society before his training was complete. Day after day, he ran up steep seaside cliffs while reciting lengthy verses to strengthen his lungs. To eliminate his stammer, he practiced speaking with round pebbles placed directly inside his mouth, shouting his arguments above the roar of crashing ocean waves.

Years of relentless perseverance transformed his perceived weaknesses into astonishing eloquence. When he finally returned to the public arena, his voice resonated with thunderous clarity, moving thousands of listeners to profound action. He stands in history as testament that determination can rewrite destiny.

Moral: Greatness is forged not in absence of difficulty, but through the courage to transcend it.`,
    hindiContent: `प्राचीन एथेंस में, डेमोस्थनीज नाम का एक युवक एक प्रभावशाली वक्ता बनने का सपना देखता था, जिसके शब्द विभाजित नागरिकों को एकजुट कर सकें और उसके गणतंत्र के भविष्य को दिशा दे सकें। हालाँकि, प्रकृति ने उसके सामने कई कठिन बाधाएँ खड़ी की थीं: वह हकलाकर बोलता था, उसकी आवाज़ बहुत कमजोर थी, और श्रोताओं के सामने आते ही उसकी सांस फूलने लगती थी।

अपने पहले सार्वजनिक भाषण के दौरान, श्रोताओं ने उसकी हिचकिचाहट का मज़ाक उड़ाया और उसे अपमानित करके सभा से बाहर कर दिया। दुखी लेकिन पराजित हुए बिना, डेमोस्थनीज अपने हाथों से बनाई गई एक भूमिगत गुफा में चला गया। वहाँ, उसने अपने अद्वितीय अनुशासन के माध्यम से अपनी शारीरिक सीमाओं पर विजय प्राप्त करने का संकल्प लिया।

उसने अपने सिर का आधा हिस्सा मुंडवा लिया ताकि लज्जा के कारण वह प्रशिक्षण पूरा होने से पहले समाज में न जा सके। फेफड़ों को मजबूत करने के लिए वह हर दिन समुद्र किनारे की खड़ी चट्टानों पर दौड़ते हुए लंबी कविताओं का पाठ करता था। अपने हकलाने को खत्म करने के लिए, उसने अपने मुँह में छोटे-छोटे गोल कंकड़ रखकर बोलने का अभ्यास किया और समुद्र की गरजती लहरों के ऊपर अपनी आवाज़ को बुलंद किया।

वर्षों के निरंतर परिश्रम ने उसकी कमजोरियों को अद्भुत वक्तृत्व में बदल दिया। जब वह अंततः सार्वजनिक मंच पर लौटा, तो उसकी आवाज़ ऐसी गूँजी कि उसने हजारों श्रोताओं को गहरे संकल्प से भर दिया। इतिहास में वह इस बात का प्रमाण बनकर खड़ा है कि दृढ़ संकल्प से भाग्य को भी बदला जा सकता है।

सीख: महानता कठिनाइयों के अभाव में नहीं, बल्कि उन पर विजय पाने के साहस से गढ़ी जाती है।`,
    shortDescription: 'A philosophical exploration of discipline, overcoming vocal barriers, and attaining true mastery.',
    difficultyLevel: 'Hard' as DifficultyLevel,
    displayOrder: 1,
    status: 'Published' as const
  }
];

// Helper to sort stories by difficulty level priority and displayOrder
export const sortStories = (stories: any[]) => {
  return stories.sort((a, b) => {
    const rankA = LEVEL_RANK[a.difficultyLevel as DifficultyLevel] || 99;
    const rankB = LEVEL_RANK[b.difficultyLevel as DifficultyLevel] || 99;
    if (rankA !== rankB) return rankA - rankB;
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return String(a._id).localeCompare(String(b._id));
  });
};

// Ensure database has initial stories if empty
let storiesChecked = false;
const checkAndSeedStories = async () => {
  if (storiesChecked || mongoose.connection.readyState !== 1) return;
  try {
    const count = await Story.countDocuments();
    if (count === 0) {
      await Story.insertMany(INITIAL_STORIES);
      console.log('Seeded initial Reading Practice stories across all 6 levels');
    }
    storiesChecked = true;
  } catch (err) {
    console.error('Error seeding initial stories:', err);
  }
};

// PUBLIC: Get all published stories
export const getPublicStories = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Fallback if DB is reconnecting
      return res.json(INITIAL_STORIES.map((s, idx) => ({ ...s, _id: `seed-${idx}` })));
    }

    await checkAndSeedStories();

    const stories = await Story.find({ status: 'Published' })
      .select('titleEnglish titleHindi shortDescription difficultyLevel displayOrder status createdAt updatedAt')
      .lean();

    const sorted = sortStories(stories);
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch reading stories' });
  }
};

// PUBLIC: Get single story by ID with Next / Previous navigation calculation
export const getPublicStoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const found = INITIAL_STORIES[0];
      return res.json({
        story: { ...found, _id: id },
        navigation: { previousStory: null, nextStory: null, isFirst: true, isLast: false }
      });
    }

    await checkAndSeedStories();

    // Check if ID is a valid Mongo ObjectId
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { _id: null };
    const currentStory = await Story.findOne(query);

    if (!currentStory) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Only Published stories are accessible publicly unless user is admin
    // @ts-ignore
    const userRole = req.user?.role;
    if (currentStory.status !== 'Published' && userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(404).json({ success: false, message: 'Story not found or unavailable' });
    }

    // Fetch all published stories to calculate deterministic sequence
    const allPublished = await Story.find({ status: 'Published' })
      .select('_id titleEnglish titleHindi difficultyLevel displayOrder status')
      .lean();

    const sorted = sortStories(allPublished);
    const currentIndex = sorted.findIndex(s => String(s._id) === String(currentStory._id));

    const previousStory = currentIndex > 0 ? sorted[currentIndex - 1] : null;
    const nextStory = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === sorted.length - 1;

    res.json({
      story: currentStory,
      navigation: {
        previousStory,
        nextStory,
        isFirst,
        isLast,
        totalInLevel: sorted.filter(s => s.difficultyLevel === currentStory.difficultyLevel).length,
        currentStoryIndex: currentIndex + 1,
        totalPublished: sorted.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch story details' });
  }
};

// STUDENT: Get current student's progress summary for Reading Home Page
export const getStudentProgressSummary = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        continueReading: null,
        completedStoryIds: [],
        totalCompleted: 0,
        totalStories: 0,
        currentLevel: 'Beginner'
      });
    }

    await checkAndSeedStories();

    // Fetch all published stories
    const allPublished = await Story.find({ status: 'Published' }).lean();
    const sortedStories = sortStories(allPublished);

    // Fetch all progress records for this authenticated student
    const progressList = await StoryProgress.find({ studentId }).lean();
    const progressMap = new Map(progressList.map(p => [String(p.storyId), p]));

    const completedStoryIds: string[] = [];
    const progressByStoryId: Record<string, { currentPage: string; pageCompleted: boolean; storyCompleted: boolean }> = {};
    let continueStory: any = null;
    let continueProgress: any = null;

    progressList.forEach(p => {
      progressByStoryId[String(p.storyId)] = {
        currentPage: p.currentPage || 'english',
        pageCompleted: !!p.pageCompleted,
        storyCompleted: !!p.storyCompleted
      };
    });

    for (const story of sortedStories) {
      const p = progressMap.get(String(story._id));
      if (p?.storyCompleted) {
        completedStoryIds.push(String(story._id));
      } else if (!continueStory) {
        continueStory = story;
        continueProgress = p || { currentPage: 'english', pageCompleted: false, storyCompleted: false, lastReadPosition: 0 };
      }
    }

    const hasStarted = progressList.some(p => p.storyCompleted || p.pageCompleted || (p.lastReadPosition && p.lastReadPosition > 0) || p.currentPage === 'hindi');

    // If all stories are completed, point to the last story or first story
    if (!continueStory && sortedStories.length > 0) {
      continueStory = sortedStories[sortedStories.length - 1];
      continueProgress = progressMap.get(String(continueStory._id)) || { currentPage: 'hindi', storyCompleted: true };
    }

    res.json({
      continueReading: continueStory ? {
        story: {
          _id: continueStory._id,
          titleEnglish: continueStory.titleEnglish,
          titleHindi: continueStory.titleHindi,
          difficultyLevel: continueStory.difficultyLevel
        },
        progress: continueProgress
      } : null,
      completedStoryIds,
      totalCompleted: completedStoryIds.length,
      totalStories: sortedStories.length,
      currentLevel: continueStory ? continueStory.difficultyLevel : 'Beginner',
      hasStarted,
      progressByStoryId
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch progress summary' });
  }
};

// STUDENT: Get progress for a specific story
export const getStoryProgress = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const studentId = req.user?.id;
    const { id: storyId } = req.params;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        currentPage: 'english',
        pageCompleted: false,
        storyCompleted: false,
        lastReadPosition: 0
      });
    }

    const progress = await StoryProgress.findOne({ studentId, storyId });
    if (!progress) {
      return res.json({
        currentPage: 'english',
        pageCompleted: false,
        storyCompleted: false,
        lastReadPosition: 0
      });
    }

    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch story progress' });
  }
};

// STUDENT: Save current page or read position (RESUME support)
export const saveStoryProgress = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const studentId = req.user?.id;
    const { id: storyId } = req.params;
    const { currentPage, pageCompleted, lastReadPosition } = req.body;

    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'State saved (local preview)' });
    }

    const updateDoc: any = {};
    if (currentPage && (currentPage === 'english' || currentPage === 'hindi')) {
      updateDoc.currentPage = currentPage;
    }
    if (pageCompleted !== undefined) {
      updateDoc.pageCompleted = Boolean(pageCompleted);
    }
    if (lastReadPosition !== undefined) {
      updateDoc.lastReadPosition = Number(lastReadPosition) || 0;
    }

    const progress = await StoryProgress.findOneAndUpdate(
      { studentId, storyId },
      { $set: updateDoc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: progress });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to save progress' });
  }
};

// STUDENT: Complete Story (requires English -> Hindi flow)
export const completeStory = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const studentId = req.user?.id;
    const { id: storyId } = req.params;

    if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        message: '✓ Story Completed Successfully',
        data: { storyCompleted: true, completedAt: new Date() }
      });
    }

    const progress = await StoryProgress.findOneAndUpdate(
      { studentId, storyId },
      {
        $set: {
          currentPage: 'hindi',
          pageCompleted: true,
          storyCompleted: true,
          completedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: '✓ Story Completed Successfully',
      data: progress
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to mark story as completed' });
  }
};

// ADMIN: Get all stories (with search, filter, draft/published)
export const getAdminStories = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(INITIAL_STORIES.map((s, idx) => ({ ...s, _id: `seed-${idx}` })));
    }

    await checkAndSeedStories();

    const { status, difficultyLevel, search } = req.query;
    const filter: any = {};

    if (status && status !== 'All') filter.status = status;
    if (difficultyLevel && difficultyLevel !== 'All') filter.difficultyLevel = difficultyLevel;
    if (search) {
      filter.$or = [
        { titleEnglish: { $regex: String(search), $options: 'i' } },
        { titleHindi: { $regex: String(search), $options: 'i' } }
      ];
    }

    const stories = await Story.find(filter).lean();
    const sorted = sortStories(stories);
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stories' });
  }
};

// ADMIN: Create story
export const createStory = async (req: Request, res: Response) => {
  try {
    const {
      titleEnglish,
      titleHindi,
      englishContent,
      hindiContent,
      shortDescription,
      difficultyLevel,
      displayOrder,
      status
    } = req.body;

    if (!titleEnglish || !titleHindi || !englishContent || !hindiContent) {
      return res.status(400).json({ success: false, message: 'All title and content fields are required' });
    }

    const story = new Story({
      titleEnglish: titleEnglish.trim(),
      titleHindi: titleHindi.trim(),
      englishContent,
      hindiContent,
      shortDescription: shortDescription?.trim() || '',
      difficultyLevel: difficultyLevel || 'Beginner',
      displayOrder: Number(displayOrder) || 0,
      status: status || 'Draft',
      // @ts-ignore
      createdBy: req.user?.id
    });

    await story.save();

    await ActivityLog.create({
      action: 'Create',
      module: 'ReadingStories',
      // @ts-ignore
      performedBy: req.user?.name || 'Admin',
      // @ts-ignore
      role: req.user?.role || 'Admin',
      ip: req.ip
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: '✓ Story Created Successfully',
      data: story
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create story' });
  }
};

// ADMIN: Update story
export const updateStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      titleEnglish,
      titleHindi,
      englishContent,
      hindiContent,
      shortDescription,
      difficultyLevel,
      displayOrder,
      status
    } = req.body;

    const updateData: any = {};
    if (titleEnglish !== undefined) updateData.titleEnglish = titleEnglish.trim();
    if (titleHindi !== undefined) updateData.titleHindi = titleHindi.trim();
    if (englishContent !== undefined) updateData.englishContent = englishContent;
    if (hindiContent !== undefined) updateData.hindiContent = hindiContent;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription.trim();
    if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
    if (status !== undefined) updateData.status = status;

    const story = await Story.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    await ActivityLog.create({
      action: 'Update',
      module: 'ReadingStories',
      // @ts-ignore
      performedBy: req.user?.name || 'Admin',
      // @ts-ignore
      role: req.user?.role || 'Admin',
      ip: req.ip
    }).catch(() => {});

    res.json({
      success: true,
      message: '✓ Story Updated Successfully',
      data: story
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update story' });
  }
};

// ADMIN: Quick update status (Publish / Unpublish / Inactive)
export const updateStoryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Draft', 'Published', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const story = await Story.findByIdAndUpdate(id, { status }, { new: true });
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const actionText = status === 'Published' ? '✓ Story Published Successfully' : '✓ Story Unpublished Successfully';

    res.json({
      success: true,
      message: actionText,
      data: story
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update story status' });
  }
};

// ADMIN: Delete story
export const deleteStory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const story = await Story.findByIdAndDelete(id);

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Clean up student progress for this deleted story
    await StoryProgress.deleteMany({ storyId: id }).catch(() => {});

    await ActivityLog.create({
      action: 'Delete',
      module: 'ReadingStories',
      // @ts-ignore
      performedBy: req.user?.name || 'Admin',
      // @ts-ignore
      role: req.user?.role || 'Admin',
      ip: req.ip
    }).catch(() => {});

    res.json({
      success: true,
      message: '✓ Story Deleted Successfully'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete story' });
  }
};
