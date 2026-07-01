// Run: node scripts/seed-p1-english-scheme.mjs
// Seeds P1 English Term 1 scheme of work into Supabase
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://supabase.alheibschool.org";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzkzNTk5NzgsImV4cCI6MTkzNzAzOTk3OH0.ceJxy0upSobq7LP9CVnAH6QDYV7bvHv8dtLbV6rLokM";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log(`Connecting to ${supabaseUrl}...`);

  // Check curriculum_topics table exists, create if not
  const { error: ctCheck } = await supabase.from("curriculum_topics").select("id").limit(1);
  if (ctCheck?.message?.includes("does not exist")) {
    console.log("Creating curriculum_topics table...");
    const { error: ctErr } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.curriculum_topics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          curriculum_plan_id UUID REFERENCES public.curriculum_plans(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          sub_topics JSONB DEFAULT '[]'::jsonb,
          expected_lessons INTEGER DEFAULT 1,
          sequence_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
      `
    });
    if (ctErr) console.warn("Could not create table via RPC:", ctErr.message);
  }

  // Get P1 class
  const { data: classes } = await supabase.from("classes").select("id").eq("level", 1).limit(1);
  if (!classes?.length) { console.error("P1 class not found"); return; }
  const p1Id = classes[0].id;

  // Get English subject, create if missing
  let { data: engSubj } = await supabase.from("subjects").select("id, min_class_level").eq("code", "ENG").limit(1);
  if (!engSubj?.length) {
    console.log("Creating English subject...");
    const { data: ins, error: insErr } = await supabase.from("subjects").insert({
      name: "English", code: "ENG", is_core: true,
      min_class_level: 1, max_class_level: 7,
      category: "academic", grading_type: "numeric", display_order: 3
    }).select("id, min_class_level").single();
    if (insErr) { console.error("Failed to create English:", insErr.message); return; }
    engSubj = [ins];
  } else if (engSubj[0].min_class_level > 1) {
    console.log("Updating English min_class_level to 1...");
    await supabase.from("subjects").update({ min_class_level: 1 }).eq("id", engSubj[0].id);
  }
  const engId = engSubj[0].id;

  // Check if already seeded
  const { data: existing } = await supabase
    .from("curriculum_plans")
    .select("id")
    .eq("class_id", p1Id)
    .eq("subject_id", engId)
    .eq("term", "term_1")
    .limit(1);
  if (existing?.length) {
    console.log("P1 English Term 1 scheme already seeded, skipping.");
    return;
  }

  console.log("Seeding P1 English Term 1 scheme of work...");

  const plans = [
    {
      topic_title: "Our School – People in Our School",
      sequence_order: 1,
      description: "Week 1-2: Greetings, titles, nouns, and a poem about school",
      topics: [
        { title: "Vocabulary – Titles", sub_topics: ["sir", "Madam", "teacher", "miss", "Mrs.", "Mr."], expected_lessons: 2, sequence_order: 1 },
        { title: "Greetings", sub_topics: ["Good morning", "Good afternoon", "Greeting each other"], expected_lessons: 2, sequence_order: 2 },
        { title: "Comprehension – Dialogue", sub_topics: ["Names: Birungi, Kamya, Kalyango, Kizito", "Acting a dialogue"], expected_lessons: 2, sequence_order: 3 },
        { title: "Nouns – Classroom Objects", sub_topics: ["chair, duster, table, window, book, desk, pen, pencil", "chalk, wall, roof, register", "Structures: What is this? That is a…"], expected_lessons: 3, sequence_order: 4 },
        { title: "Poem – Our School", sub_topics: ["Reading a poem", "Answering questions in full sentences"], expected_lessons: 1, sequence_order: 5 },
      ]
    },
    {
      topic_title: "Our School – Activities Done at School",
      sequence_order: 2,
      description: "Week 2-3: Letters, alphabetical order, articles, present continuous tense",
      topics: [
        { title: "Small Letters A–Z", sub_topics: ["A B C D E F G H", "a b c d e f g h i", "Ordering letters and words"], expected_lessons: 3, sequence_order: 1 },
        { title: "Alphabetical Ordering", sub_topics: ["Ordering letters: d, a, c, b", "Ordering words: bag, car, axe, van, tin, window"], expected_lessons: 2, sequence_order: 2 },
        { title: "Articles – a / an", sub_topics: ["Words that take a", "Words that take an"], expected_lessons: 2, sequence_order: 3 },
        { title: "Present Continuous Tense", sub_topics: ["Adding -ing to verbs: sweep→sweeping", "Use of is and are"], expected_lessons: 3, sequence_order: 4 },
        { title: "Pronouns", sub_topics: ["He, she, I, it, we, you, they", "Talking about oneself"], expected_lessons: 2, sequence_order: 5 },
        { title: "Comprehension – Story about School", sub_topics: ["Reading a story", "Answering questions"], expected_lessons: 1, sequence_order: 6 },
        { title: "Composition – Substitution Table", sub_topics: ["I am reading", "She is writing", "We are listening"], expected_lessons: 1, sequence_order: 7 },
      ]
    },
    {
      topic_title: "Our Home – People in Our Home",
      sequence_order: 3,
      description: "Week 3-4: Family vocabulary, plural nouns",
      topics: [
        { title: "Family Vocabulary", sub_topics: ["father, mother, son, sister, brother", "Structures: What is … doing?"], expected_lessons: 2, sequence_order: 1 },
        { title: "Plural Nouns – Add s", sub_topics: ["son→sons", "sister→sisters"], expected_lessons: 1, sequence_order: 2 },
        { title: "Plural Nouns – Add es", sub_topics: ["bench→benches", "mango→mangoes"], expected_lessons: 1, sequence_order: 3 },
        { title: "Plural Nouns – f to ves", sub_topics: ["Changing f to v and adding es"], expected_lessons: 1, sequence_order: 4 },
        { title: "Plural Nouns – y to ies", sub_topics: ["baby→babies", "fly→flies"], expected_lessons: 1, sequence_order: 5 },
        { title: "Comprehension – My Family", sub_topics: ["Reading a story about family", "Answering questions in full sentences"], expected_lessons: 1, sequence_order: 6 },
      ]
    },
    {
      topic_title: "Our Home – Things Found in Our Home",
      sequence_order: 4,
      description: "Week 4-6: Opposites, number words, comprehension, composition",
      topics: [
        { title: "Opposites", sub_topics: ["good–bad, small–big, thin–fat, black–white, soft–hard"], expected_lessons: 2, sequence_order: 1 },
        { title: "Number Words 0–20", sub_topics: ["zero to twenty", "How many are there?"], expected_lessons: 2, sequence_order: 2 },
        { title: "Comprehension – My Home", sub_topics: ["Reading a story about home", "Answering questions in full sentences"], expected_lessons: 1, sequence_order: 3 },
        { title: "Role Play – Activities at Home", sub_topics: ["Role playing activities done at home", "Writing sentences about home activities"], expected_lessons: 2, sequence_order: 4 },
      ]
    },
    {
      topic_title: "Our Home – Activities Done at Home",
      sequence_order: 5,
      description: "Week 5: Present continuous (drop e), guided composition",
      topics: [
        { title: "Present Continuous – Drop e", sub_topics: ["write→writing", "Structures: What is he/she doing?"], expected_lessons: 2, sequence_order: 1 },
        { title: "Home Vocabulary", sub_topics: ["cup, house, dog, spoon, kitchen, goat, plate, toilet", "cow, table, latrine, sheep, radio, cat, hen", "television, rabbit, pot, duck, bed, mortar, turkey", "shoes, pestle, bird, towel"], expected_lessons: 3, sequence_order: 2 },
        { title: "Comprehension – Dialogue with Milkman", sub_topics: ["Reading and role playing a dialogue", "Answering questions in full sentences"], expected_lessons: 1, sequence_order: 3 },
        { title: "Guided Composition", sub_topics: ["Filling in missing words", "This is a… Her name is Jane…"], expected_lessons: 1, sequence_order: 4 },
      ]
    },
    {
      topic_title: "Our Community – People in Our Community",
      sequence_order: 6,
      description: "Week 6-7: Community workers, punctuation, comprehension",
      topics: [
        { title: "Community Workers Vocabulary", sub_topics: ["teacher, doctor, pastor, policeman, nurse, carpenter", "barber, bishop, priest, imam, pilot, driver"], expected_lessons: 3, sequence_order: 1 },
        { title: "Punctuation – Capital Letters", sub_topics: ["Names of people, places, days, months", "Starting a sentence"], expected_lessons: 2, sequence_order: 2 },
        { title: "Comprehension – People in Our Community", sub_topics: ["Reading a story", "Answering questions in full sentences"], expected_lessons: 1, sequence_order: 3 },
        { title: "Composition – Jumbled Words", sub_topics: ["Arranging words to make sentences"], expected_lessons: 1, sequence_order: 4 },
      ]
    },
    {
      topic_title: "Our Community – Important Places",
      sequence_order: 7,
      description: "Week 7-8: Places, prepositions, comprehension dialogue",
      topics: [
        { title: "Places Vocabulary", sub_topics: ["market, church, mosque, shop, school, bank", "hospital, police station, post office, radio station", "Structures: Where is the…? Show me a…?"], expected_lessons: 2, sequence_order: 1 },
        { title: "Prepositions", sub_topics: ["under, near, in, on, over, behind, in front of, between"], expected_lessons: 2, sequence_order: 2 },
        { title: "Comprehension – Dialogue", sub_topics: ["Dialogue between Ritah and Peter", "Role play"], expected_lessons: 1, sequence_order: 3 },
        { title: "Composition – Substitution Table", sub_topics: ["They go to school to learn", "They go to church to pray"], expected_lessons: 1, sequence_order: 4 },
      ]
    },
    {
      topic_title: "Our Community – Activities in Our Community",
      sequence_order: 8,
      description: "Week 8: Action verbs, continuous tense (double consonant), places of work",
      topics: [
        { title: "Action Verbs", sub_topics: ["harvest, sell, plant, dry, weed, farm, wash, trade, build"], expected_lessons: 2, sequence_order: 1 },
        { title: "Present Continuous – Double Consonant", sub_topics: ["cut→cutting, skip→skipping", "Structures: What is he/she doing?"], expected_lessons: 2, sequence_order: 2 },
        { title: "People and Their Places of Work", sub_topics: ["teacher→school, farmer→garden, priest→church", "Interpreting pictures and writing sentences"], expected_lessons: 2, sequence_order: 3 },
        { title: "Comprehension – Important Places Story", sub_topics: ["Reading a story on important places in our community"], expected_lessons: 1, sequence_order: 4 },
      ]
    },
  ];

  for (const plan of plans) {
    const { data: newPlan, error: planErr } = await supabase.from("curriculum_plans").insert({
      class_id: p1Id,
      subject_id: engId,
      term: "term_1",
      academic_year: 2026,
      topic_title: plan.topic_title,
      sequence_order: plan.sequence_order,
      description: plan.description,
    }).select("id").single();

    if (planErr) {
      console.error(`  Failed to create plan "${plan.topic_title}":`, planErr.message);
      continue;
    }

    for (const topic of plan.topics) {
      const { error: topicErr } = await supabase.from("curriculum_topics").insert({
        curriculum_plan_id: newPlan.id,
        title: topic.title,
        sub_topics: topic.sub_topics,
        expected_lessons: topic.expected_lessons,
        sequence_order: topic.sequence_order,
      });
      if (topicErr) console.error(`  Failed to create topic "${topic.title}":`, topicErr.message);
    }
    console.log(`  ✓ ${plan.topic_title} (${plan.topics.length} topics)`);
  }

  console.log("Done! P1 English Term 1 scheme is now active.");
}

run().catch(console.error);
