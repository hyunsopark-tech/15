"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Search, ChevronDown, ChevronUp,
  BookOpen, Clock, AlertTriangle, Star, Plus,
  MessageSquare, UserPlus, Stethoscope, DollarSign,
  Pencil, Trash2, X, Check, Tag, RotateCcw,
  FileText, Shield, ClipboardList, Sparkles,
} from "lucide-react";

// ─── SECTION NAVIGATION ───────────────────────────────────────────────────────

type Section = "scripts" | "sop" | "insurance";

const SECTIONS: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
  { id: "scripts",   label: "Call Scripts",    icon: Phone,         description: "Scripts for every phone situation" },
  { id: "sop",       label: "Phone SOP",       icon: ClipboardList, description: "How to answer & handle calls"       },
  { id: "insurance", label: "Insurance Info",  icon: Shield,        description: "Carriers, portals & verification"   },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface QA {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  script: string;
  tips?: string;
  followUp?: string;
  isCustom?: boolean;
  isEdited?: boolean;
}

interface SOPBlock {
  id: string;
  title: string;
  body: string;
}

interface InsuranceBlock {
  id: string;
  title: string;
  body: string;
}

// ─── CALL SCRIPTS DATABASE ────────────────────────────────────────────────────

const QA_DATABASE: QA[] = [
  {
    id: "s1", category: "Scheduling",
    keywords: ["appointment", "schedule", "book", "available", "opening", "when", "come in", "visit"],
    question: "How do I schedule an appointment?",
    script: `"Thank you for calling Memorial Children's Dentistry! We'd love to get your child scheduled. I just need a few quick details — what's your child's name and date of birth? [pause] And what's the best phone number for you? [pause] Are you looking for a new patient visit or a return visit? Great! We have availability on [check schedule and offer 2 specific times]. Would either of those work for your family?"`,
    tips: "Always offer exactly 2 time options — not 'when are you free?' Keep it easy for the parent.",
    followUp: "Confirm name, DOB, phone, and insurance before ending the call.",
  },
  {
    id: "s2", category: "Scheduling",
    keywords: ["cancel", "reschedule", "change appointment", "can't make it", "move", "different day"],
    question: "Parent wants to cancel or reschedule",
    script: `"No problem at all! I can help you reschedule. Can I get your child's name and date of birth? [pause] I'm looking at our schedule — we have [offer 2 options]. Which works better for you? [pause] Perfect, I'll get that updated. Is there anything you'd like me to note for the doctor before the visit?"`,
    tips: "Never just cancel without offering to reschedule. Always re-book before ending the call.",
    followUp: "Update appointment in Open Dental and send confirmation.",
  },
  {
    id: "s3", category: "Scheduling",
    keywords: ["wait", "waiting list", "next available", "soon", "sooner", "earliest", "urgent"],
    question: "Parent asking for earliest / soonest appointment",
    script: `"I completely understand — let me check our earliest availability for you. [pause] Our next opening is [date and time]. I can also put your child on our priority cancellation list, which means we'll call you right away if something opens up sooner. Would you like me to do both?"`,
    tips: "Always put them on the cancellation list AND book the later slot. Don't let them leave without a confirmed appointment.",
  },
  {
    id: "s4", category: "Scheduling",
    keywords: ["hours", "open", "close", "when are you open", "saturday", "weekend", "evening"],
    question: "What are your office hours?",
    script: `"We're open Monday through Friday. Our hours are [insert your office hours]. We do not see patients on weekends, but if you have a dental emergency, please [follow your after-hours protocol]. Is there a day or time that works best for your family and I can check what we have available?"`,
    tips: "Always transition from answering hours into offering to schedule.",
  },
  {
    id: "np1", category: "New Patients",
    keywords: ["new patient", "first time", "never been", "new here", "first visit", "establish"],
    question: "New patient calling for the first time",
    script: `"Welcome! We're so glad you called Memorial Children's Dentistry — we love meeting new patients! For a first visit, we'll do a complete exam, X-rays if needed, and a cleaning. The whole appointment is usually about an hour. Can I get your child's name and date of birth? [pause] And do you have dental insurance? [pause] Great — let me check what we have for new patients. We have [2 options]. Which works better?"`,
    tips: "Set expectations on what the first visit includes so parents aren't surprised. Make it warm and welcoming.",
    followUp: "Collect: child's name, DOB, guardian name, phone, insurance, and email for new patient forms.",
  },
  {
    id: "np2", category: "New Patients",
    keywords: ["forms", "paperwork", "new patient forms", "fill out", "send forms", "online forms"],
    question: "Where do I find the new patient forms?",
    script: `"We'll send you a link to complete everything online before your visit — it usually takes about 5 minutes. Can I confirm the best email address for you? [pause] We'll send that right over. If you have any trouble with the link, just give us a call and we're happy to help. We'll also need a copy of your insurance card, which you can text to [office number] or bring with you on the day of the appointment."`,
    tips: "Send forms as soon as the appointment is booked. Follow up 48 hours before if forms aren't completed.",
  },
  {
    id: "np3", category: "New Patients",
    keywords: ["age", "how old", "toddler", "baby", "infant", "first tooth", "first birthday"],
    question: "When should my child first come to the dentist?",
    script: `"That's a great question! The American Academy of Pediatric Dentistry recommends the first dental visit by age 1, or within 6 months of the first tooth coming in — whichever comes first. Early visits help us catch anything early and help your little one get comfortable with the dentist. We make it really fun and low-pressure for toddlers! Would you like to go ahead and get them scheduled?"`,
    tips: "This is a great opportunity to schedule. Parents asking this question are already interested.",
  },
  {
    id: "ins1", category: "Insurance & Billing",
    keywords: ["insurance", "accept", "take", "medicaid", "chip", "ppo", "delta", "cigna", "aetna", "blue cross", "united"],
    question: "Do you accept my insurance?",
    script: `"Great question! We accept most major dental insurance plans including PPO plans and Medicaid / CHIP. Can I get the name of your insurance carrier and your member ID? [pause] Let me look that up for you. [after checking] Yes, we are in-network with [plan name]! Your insurance should cover [explain coverage]. We'll verify your benefits before the appointment and let you know of any estimated out-of-pocket costs ahead of time."`,
    tips: "If NOT in-network: 'We're an out-of-network provider for that plan, which means we can still submit claims on your behalf and you may still get reimbursed — would you like me to check what your plan covers?' Never just say no.",
    followUp: "Collect insurance carrier, member ID, and subscriber DOB to verify benefits.",
  },
  {
    id: "ins2", category: "Insurance & Billing",
    keywords: ["cost", "how much", "price", "fee", "charge", "pay", "out of pocket", "estimate", "copay", "deductible"],
    question: "How much will it cost? What's my out-of-pocket?",
    script: `"That's such an important question and I'm glad you asked! The cost really depends on your specific insurance plan and what treatment your child needs. What I can do is verify your benefits before the appointment so you have a clear picture of what your insurance covers and what your estimated portion would be. There are no surprises here — we always go over costs with you before starting any treatment. Can I get your insurance information so I can look into that for you?"`,
    tips: "Never quote exact fees without verifying insurance first. Reassure them there are no surprises — this builds trust.",
  },
  {
    id: "ins3", category: "Insurance & Billing",
    keywords: ["payment plan", "payment options", "care credit", "financing", "can't afford", "monthly", "pay over time"],
    question: "Do you offer payment plans?",
    script: `"Absolutely — we want to make sure your child can get the care they need without financial stress. We do offer flexible payment options, and we also work with CareCredit which allows you to break up the cost into monthly payments, often with no interest. Our team will go over all the options with you before any treatment begins so you can choose what works best for your family. Would you like more information on that, or shall we get your child scheduled first?"`,
    tips: "Lead with empathy. Don't make parents feel judged for asking about financial options.",
  },
  {
    id: "ins4", category: "Insurance & Billing",
    keywords: ["claim", "denied", "denial", "rejected", "not covered", "insurance won't pay", "appeal"],
    question: "My insurance denied a claim",
    script: `"I'm so sorry to hear that — I know how frustrating that can be. Let me look into your account and find out exactly what happened with the claim. [look up in Open Dental] It looks like the claim was [denied / pending] for [reason]. Our billing team is going to follow up on this right away and we'll contact your insurance company to see what we can do. We'll call you back by [give specific timeframe] with an update. Is this the best number to reach you?"`,
    tips: "Never leave a parent hanging on a denied claim. Set a specific callback time and follow through.",
    followUp: "Create a task in Open Dental to follow up on the claim within 24 hours.",
  },
  {
    id: "tx1", category: "Treatment & Procedures",
    keywords: ["cavity", "filling", "decay", "tooth decay", "cavities", "hole in tooth"],
    question: "My child has a cavity — what happens?",
    script: `"I know it can feel worrying, but cavities are really common in kids and we treat them every day! For a filling, we'll numb the area with a gentle anesthetic so your child won't feel anything during the procedure. The appointment usually takes about 45 minutes to an hour. We work really hard to make it a comfortable, positive experience — most kids do great! Any questions I can answer before the appointment?"`,
    tips: "Use reassuring, calm language. Avoid words like 'drill' or 'shot.' Say 'numb the area' not 'give a shot.'",
  },
  {
    id: "tx2", category: "Treatment & Procedures",
    keywords: ["extraction", "pull", "remove tooth", "tooth pulled", "baby tooth", "loose tooth"],
    question: "Does my child need a tooth pulled?",
    script: `"Extractions sound scary but we do them very gently and your child will be comfortable the whole time. We numb the area first so they won't feel any pain during the procedure. Afterward there are simple instructions to follow at home — mostly just soft foods and some rest. The whole thing is usually pretty quick, about 20–30 minutes. Is there anything specific you're concerned about that I can help address?"`,
    tips: "Say 'remove' or 'take out' rather than 'pull' — it sounds less scary to parents.",
  },
  {
    id: "tx3", category: "Treatment & Procedures",
    keywords: ["crown", "cap", "stainless steel", "silver crown", "tooth cap"],
    question: "What is a crown and why does my child need one?",
    script: `"A crown is basically a protective cover that goes over a tooth that's been too damaged for a filling to hold. For baby teeth we often use stainless steel crowns — they're silver-colored, very durable, and they're placed in just one appointment. As your child grows and loses the baby tooth naturally, the crown comes out with it. They're really the best way to protect the tooth and prevent pain. Do you have any questions about the procedure or the cost?"`,
    tips: "Parents often worry about appearance. Mention that baby crowns are temporary and come out naturally.",
  },
  {
    id: "tx4", category: "Treatment & Procedures",
    keywords: ["sedation", "laughing gas", "nitrous", "put to sleep", "anesthesia", "scared", "anxious", "nervous"],
    question: "Is sedation available for anxious kids?",
    script: `"Absolutely — your child's comfort is our top priority. We offer nitrous oxide, also called laughing gas, which helps kids feel relaxed and calm during treatment. It's very safe, wears off quickly, and most kids actually enjoy it! For children with more significant anxiety or extensive treatment needs, we can also discuss other sedation options. Dr. [name] will go over everything with you at the appointment. Would you like me to note that your child may need extra support so we can plan accordingly?"`,
    tips: "Validate the parent's concern first before launching into options. Make them feel heard.",
  },
  {
    id: "tx5", category: "Treatment & Procedures",
    keywords: ["sealant", "sealants", "preventive", "prevention", "protect teeth"],
    question: "What are sealants and does my child need them?",
    script: `"Sealants are a thin protective coating we paint onto the back teeth — the molars — to prevent cavities from forming in the grooves. They're completely painless, take just a few minutes per tooth, and can protect those teeth for years. We typically recommend them when the 6-year and 12-year molars come in. Dr. [name] will check at the exam and let you know if your child would benefit from them. They're usually covered by insurance too!"`,
  },
  {
    id: "em1", category: "Emergencies",
    keywords: ["emergency", "pain", "hurts", "toothache", "swollen", "swelling", "knocked out", "fell", "broken", "chipped", "urgent"],
    question: "My child is in pain / dental emergency",
    script: `"Oh, I'm so sorry to hear that — let's get your child seen right away. Can you describe what's going on? [listen carefully] [If swelling or severe pain]: We want to see them today. Let me check our emergency availability right now. [If mild/manageable]: We can get them in [today or earliest slot]. In the meantime, children's ibuprofen or Tylenol can help with the discomfort — just follow the dosing on the package for their age and weight. What's your child's name and date of birth so I can pull up their chart?"`,
    tips: "Never turn away a child in pain. Always find same-day or next-day availability for emergencies.",
    followUp: "Flag the appointment as EMERGENCY in Open Dental so the clinical team is prepared.",
  },
  {
    id: "em2", category: "Emergencies",
    keywords: ["knocked out", "tooth fell out", "tooth came out", "avulsed", "permanent tooth"],
    question: "My child knocked out a permanent tooth",
    script: `"This is a dental emergency — please stay calm. Here's exactly what to do right now: Pick up the tooth by the white part, not the root. If it's dirty, rinse it gently with milk or water — do NOT scrub it. If you can, gently place it back in the socket and have your child hold it there. If not, put the tooth in a cup of milk or saliva to keep it moist. Come to our office immediately — time is very important with a knocked-out tooth. Is your child okay otherwise? We'll be ready for you when you arrive."`,
    tips: "Speed is critical — a knocked-out permanent tooth can be re-implanted within 30–60 minutes. Keep your voice calm so the parent stays calm.",
  },
  {
    id: "em3", category: "Emergencies",
    keywords: ["abscess", "infection", "pus", "swollen face", "fever", "hot", "red gums"],
    question: "Possible abscess or facial swelling",
    script: `"Facial swelling and infection are something we take very seriously — I want to get your child seen today. How quickly can you come in? [pause] In the meantime, do NOT apply heat to the swelling. A cold compress is okay. If your child has a fever over 101°F or is having trouble breathing or swallowing, please go to the emergency room immediately. Otherwise come straight to us. What's your child's name so I can let the doctor know you're on your way?"`,
    tips: "Facial swelling spreading to the neck or floor of the mouth = ER immediately. Know this red flag.",
  },
  {
    id: "g1", category: "General",
    keywords: ["location", "address", "where are you", "directions", "find you", "parking"],
    question: "Where are you located?",
    script: `"We're located at [office address]. There's [parking details]. We're easy to find — [any landmark]. Would you like me to text you the address? And while I have you, are you already scheduled with us or would you like to get your child an appointment?"`,
    tips: "Always follow up a location question with an attempt to schedule if they aren't already booked.",
  },
  {
    id: "g2", category: "General",
    keywords: ["x-ray", "xray", "radiation", "safe", "how often", "x-rays needed"],
    question: "Are X-rays safe for my child?",
    script: `"That's a great question and totally understandable to ask! Dental X-rays use a very small amount of radiation — much less than a typical day of sun exposure. We also use a lead apron to protect your child. We follow the American Academy of Pediatric Dentistry guidelines on how often X-rays are needed based on your child's individual risk level. Dr. [name] will only recommend X-rays when they're clinically necessary. Does that help ease your concern?"`,
    tips: "Validate the concern before educating. Parents feel heard when you acknowledge their worry first.",
  },
  {
    id: "g3", category: "General",
    keywords: ["can I stay", "parent in room", "come back", "with child", "in the room"],
    question: "Can I stay with my child during the appointment?",
    script: `"That's something we handle on a case-by-case basis. For most appointments, especially for new or anxious patients, we welcome a parent back with the child — especially for little ones under 3. For older kids, we sometimes find they do a little better one-on-one with the doctor, but we always follow your lead and communicate with you about what works best for your child. You're always welcome to ask when you arrive and we'll go from there."`,
    tips: "Never say a blanket 'no parents back.' Be flexible and read the situation.",
  },
  {
    id: "g4", category: "General",
    keywords: ["brush", "floss", "toothpaste", "fluoride", "home care", "how to brush", "tips"],
    question: "Tips for brushing / home care",
    script: `"We love that you're asking about home care — it makes such a big difference! For kids under 3, use just a smear of fluoride toothpaste the size of a grain of rice. For kids 3 and up, a pea-sized amount twice a day. Start flossing once any two teeth are touching. And try to make it fun — let them pick their toothbrush, play a 2-minute song, or use a brushing app. Our team will go over this in detail at the appointment too!"`,
  },
  {
    id: "g5", category: "General",
    keywords: ["review", "yelp", "google", "feedback", "complaint", "unhappy", "problem", "issue", "bad experience"],
    question: "Parent is unhappy / wants to leave feedback",
    script: `"I'm really sorry to hear that your experience wasn't what you expected — that's not how we want any family to feel. I want to make this right. Can you share a little more about what happened? [listen fully without interrupting] Thank you for telling me. I'm going to share this directly with our office manager so we can address it personally. Can I get the best number to reach you? We'll be in touch within [timeframe] — we really value your family and want to do better."`,
    tips: "Never get defensive. Listen first, apologize sincerely, then escalate to the manager. Do not argue or make excuses.",
    followUp: "Alert Vanessa immediately. Log the complaint in Open Dental under the patient note.",
  },
];

// ─── DEFAULT SOP BLOCKS ───────────────────────────────────────────────────────

const DEFAULT_SOP_BLOCKS: SOPBlock[] = [
  {
    id: "sop1",
    title: "📞 Answering the Phone",
    body: `Answer by the third ring — always.

Greeting script:
"Thank you for calling Memorial Children's Dentistry, this is [your name] — how can I help you today?"

✅ Always smile when you answer — callers can hear it in your voice.
✅ Use the caller's name once you have it.
✅ Speak clearly and warmly — not rushed.
❌ Never say "Hold on a sec" and leave them without asking permission first.`,
  },
  {
    id: "sop2",
    title: "⏸️ Placing a Caller on Hold",
    body: `Always ask before placing anyone on hold — never assume.

Script:
"May I place you on a brief hold while I [look that up / check the schedule]? It will only be a moment."

Wait for their response. If they agree:
"Thank you — I'll be right back."

⏱️ Check back within 60 seconds if the hold is taking longer.
"Thank you so much for your patience — I'm still [looking into that / getting that information] for you. Just another moment."

❌ Do NOT leave someone on hold for more than 2 minutes without checking in.`,
  },
  {
    id: "sop3",
    title: "🔁 Transferring a Call",
    body: `Before transferring, briefly explain to the caller:

"I'm going to transfer you to [name / department] who can best help you with that. If we get disconnected for any reason, please call us back at 281-730-8080 and we'll take care of you."

Then introduce the caller to the receiving staff member before releasing:
"[Name], I have [caller's name] on the line — they're calling about [brief reason]. [Caller], I'm going to connect you now."

❌ Never do a blind transfer (transfer without introducing the caller).`,
  },
  {
    id: "sop4",
    title: "📋 Information to Collect on Every Call",
    body: `For scheduling / new patients, always collect:
• Child's full name and date of birth
• Guardian name and relationship
• Best callback phone number
• Insurance carrier and member ID (if applicable)
• Email address (for forms and confirmations)
• Reason for visit / chief complaint

For returning patients:
• Child's name and DOB (to pull up their chart)
• Reason for call
• Preferred callback number if different from chart

Always read back the appointment details before ending the call:
"So I have [child's name] scheduled for [date] at [time] for [type of visit]. Is that correct?"`,
  },
  {
    id: "sop5",
    title: "🔚 Ending a Call",
    body: `Wrap up every call with warmth and a clear next step.

Closing script:
"Is there anything else I can help you with today? [pause] Wonderful — we look forward to seeing [child's name] on [date]. Have a great day!"

✅ Always be the last to say goodbye.
✅ If you promised to do something (send forms, call back, verify insurance) — do it within the hour.
✅ Log any follow-up tasks in Open Dental immediately.`,
  },
  {
    id: "sop6",
    title: "🌙 After-Hours & Voicemail",
    body: `After-hours dental emergencies:
Direct callers to the after-hours emergency line or instruct them to go to the ER if:
• There is facial swelling spreading to the neck
• The child is having difficulty breathing or swallowing
• There is uncontrolled bleeding

For non-urgent after-hours calls:
"Our office is currently closed. Please leave a message and we will return your call the next business day. If this is a dental emergency, please [after-hours protocol]."

Checking voicemail:
• Check voicemail first thing every morning
• Return all calls before 10:00 AM
• Log each returned call in Open Dental`,
  },
  {
    id: "sop7",
    title: "🗣️ Phone Etiquette Standards",
    body: `Always:
✅ Speak with a warm, calm, professional tone at all times
✅ Use the patient/child's name when you know it
✅ Thank callers for their patience when there's a wait
✅ Offer to take a message if a staff member is unavailable
✅ Repeat back key information to confirm accuracy

Never:
❌ Use slang ("Yep," "No problem," "Sure thing") — say "Of course," "Absolutely," "My pleasure"
❌ Eat, drink, or chew gum while on the phone
❌ Have side conversations while on a call
❌ Sound rushed, even if you are busy — callers should feel like the priority
❌ Tell a caller you "can't" do something — always say what you CAN do`,
  },
];

// ─── DEFAULT INSURANCE BLOCKS ─────────────────────────────────────────────────

const DEFAULT_INSURANCE_BLOCKS: InsuranceBlock[] = [
  {
    id: "ins-verify",
    title: "✅ How to Verify Benefits (Before Every Appointment)",
    body: `Run verification at least 48 hours before the appointment.

What you need:
• Insurance carrier name
• Member ID / subscriber ID
• Subscriber date of birth
• Patient date of birth and name

Where to verify:
1. Log into the payer's provider portal (Availity, TMHP, payer website)
2. Search by member ID and patient DOB
3. Confirm: plan active? Annual max? Amount used? Waiting periods? Covered procedures?

What to document in Open Dental:
• Annual maximum (individual)
• Amount used to date
• Remaining benefit
• Coverage % for preventive / basic / major
• Deductible status
• Any missing tooth clauses, waiting periods, or frequency limitations

Call the provider line if portal isn't available:
"This is [name] calling from Memorial Children's Dentistry. Our NPI is [NPI] and Tax ID is [Tax ID]. I need to verify benefits for a patient — can you help me with that?"`,
  },
  {
    id: "ins-medicaid",
    title: "🟢 Medicaid / CHIP Plans",
    body: `Texas Medicaid / CHIP plans we commonly see:
• TMHP (Texas Medicaid & Healthcare Partnership) — portal: tmhp.com
• MCNA Dental — portal: mcna.net | Provider line: 1-800-788-6262
• DentaQuest — portal: dentaquestprovider.com | Provider line: 1-800-516-0165
• UHC Medicaid (UnitedHealthcare Community Plan) — portal: uhcprovider.com
• Molina Healthcare — portal: molinahealthcare.com

Key notes for Medicaid:
• Medicaid pays as secondary only when another plan is primary (COB rules apply)
• Frequency limitations are strict — check before scheduling preventive services
• Always verify the patient is active before the visit — eligibility can change monthly
• Never bill a Medicaid patient for covered services — it's against the rules`,
  },
  {
    id: "ins-ppo",
    title: "🔵 Commercial PPO Plans",
    body: `Common PPO carriers we see:
• Delta Dental — portal: deltadentaltx.com | Provider line: 1-800-521-2651
• CIGNA Dental — portal: cigna.com/dental | Provider line: 1-800-244-6224
• Aetna Dental — portal: aetna.com | Provider line: 1-800-451-7277
• BlueCross BlueShield of Texas — portal: bcbstx.com | Provider line: 1-800-451-0287
• MetLife Dental — portal: metlife.com/dental | Provider line: 1-800-942-0854
• United Healthcare Dental — portal: uhcprovider.com | Provider line: 1-877-816-3596
• Guardian Dental — portal: guardiananytime.com | Provider line: 1-800-541-7846
• Lincoln Financial — portal: lfg.com | Provider line: 1-800-423-2765

PPO key notes:
• Always confirm in-network vs out-of-network status before quoting coverage
• Out-of-network: we can still submit claims — patient may owe the difference
• Request a pre-authorization / pre-determination for treatment plans over $500`,
  },
  {
    id: "ins-cob",
    title: "🔄 Coordination of Benefits (COB)",
    body: `When a patient has two insurance plans:

Step 1: Identify primary vs secondary
• The plan that covers the child as the primary subscriber = primary
• Birthday rule: if both parents cover the child, the parent whose birthday falls first in the calendar year = primary

Step 2: Bill primary first
• Submit the full claim to primary insurance
• Wait for the EOB (Explanation of Benefits)

Step 3: Bill secondary with primary's EOB
• Attach the primary EOB when submitting to secondary
• Secondary will pay up to their allowed amount minus what primary paid

Step 4: Patient responsibility
• Patient owes only what's left after both insurances pay (if any)
• Never collect more than the actual out-of-pocket under COB rules

Common mistake: billing secondary without the primary EOB attached → claim will be denied.`,
  },
  {
    id: "ins-preauth",
    title: "📋 Pre-Authorization / Pre-Determination",
    body: `When to submit a pre-authorization:
• Treatment plan over $300–$500 (check payer requirements)
• Crowns, extractions, sedation, oral surgery
• Any procedure flagged as "requires prior auth" on the fee schedule

How to submit:
1. Go to the payer portal and find the prior authorization section
2. Submit patient info, procedure codes, clinical narrative, and X-rays if needed
3. Note the reference number and expected turnaround (usually 5–10 business days)

While waiting:
• Do NOT schedule the procedure until auth is received
• Note the pending auth in Open Dental under the treatment plan
• Follow up after 5 business days if no response

When approved:
• Document the authorization number in Open Dental
• Note the approval expiration date (usually 90 days)
• Schedule the appointment before the auth expires`,
  },
  {
    id: "ins-denials",
    title: "⚠️ Common Denial Reasons & Fixes",
    body: `Denial: "Patient not eligible"
→ Fix: Verify eligibility on date of service (not today). If patient was eligible on DOS, resubmit with proof.

Denial: "Procedure not covered / frequency limitation"
→ Fix: Check if frequency limit applies. If legitimate, inform patient of out-of-pocket cost.

Denial: "Missing attachment / X-ray required"
→ Fix: Resubmit with the required X-rays or periodontal charting attached.

Denial: "Bundling / downcoding"
→ Fix: Submit a narrative explaining why each code is separately billable. Appeal with clinical documentation.

Denial: "Coordination of Benefits — primary EOB required"
→ Fix: Attach the primary EOB and resubmit to secondary.

Denial: "Prior authorization required"
→ Fix: Submit the auth retroactively if allowed, or write a letter of medical necessity for the appeal.

Denial: "Provider not credentialed / NPI incorrect"
→ Fix: Verify our NPI and Tax ID were submitted correctly. Contact credentialing if needed.

Always document denial code, date, action taken, and follow-up date in Open Dental commlog.`,
  },
];

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

const SCRIPTS_KEY   = "dentbooks-custom-qa";
const OVERRIDES_KEY = "dentbooks-qa-overrides";
const SOP_KEY       = "dentbooks-sop-blocks";
const INS_KEY       = "dentbooks-insurance-blocks";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveJSON<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",                      label: "All",         icon: BookOpen,      color: "text-slate-600 bg-slate-100"   },
  { id: "Scheduling",               label: "Scheduling",  icon: Clock,         color: "text-blue-700 bg-blue-50"      },
  { id: "New Patients",             label: "New Patients",icon: UserPlus,      color: "text-purple-700 bg-purple-50"  },
  { id: "Insurance & Billing",      label: "Insurance",   icon: DollarSign,    color: "text-green-700 bg-green-50"    },
  { id: "Treatment & Procedures",   label: "Treatment",   icon: Stethoscope,   color: "text-amber-700 bg-amber-50"    },
  { id: "Emergencies",              label: "Emergencies", icon: AlertTriangle, color: "text-red-700 bg-red-50"        },
  { id: "General",                  label: "General",     icon: MessageSquare, color: "text-slate-700 bg-slate-100"   },
];

const CAT_ICON_COLOR: Record<string, string> = {
  "Scheduling": "text-blue-600", "New Patients": "text-purple-600",
  "Insurance & Billing": "text-green-600", "Treatment & Procedures": "text-amber-600",
  "Emergencies": "text-red-600", "General": "text-slate-500",
};

// ─── EDITABLE BLOCK COMPONENT ─────────────────────────────────────────────────

function EditableBlock({ block, onSave, onDelete, isCustom = false }: {
  block: SOPBlock | InsuranceBlock;
  onSave: (id: string, title: string, body: string) => void;
  onDelete?: (id: string) => void;
  isCustom?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [body, setBody] = useState(block.body);

  const save = () => { onSave(block.id, title, body); setEditing(false); };
  const cancel = () => { setTitle(block.title); setBody(block.body); setEditing(false); };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${editing ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
      {editing ? (
        <div className="p-5 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={10}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none font-mono leading-relaxed"
          />
          <div className="flex justify-end gap-2">
            <button onClick={cancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button onClick={save} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-slate-900">{block.title}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {isCustom && onDelete && (
                <button onClick={() => onDelete(block.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{block.body}</pre>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const BLANK_FORM = { question: "", category: "General", keywordsRaw: "", script: "", tips: "", followUp: "" };

export default function CallCenter() {
  const [section, setSection] = useState<Section>("scripts");

  // ── Call Scripts state ───────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customQA, setCustomQA] = useState<QA[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<QA>>>({});
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState({ question: "", script: "", tips: "", followUp: "" });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── SOP state ────────────────────────────────────────────────────────────
  const [sopBlocks, setSopBlocks] = useState<SOPBlock[]>(DEFAULT_SOP_BLOCKS);

  // ── Insurance state ──────────────────────────────────────────────────────
  const [insBlocks, setInsBlocks] = useState<InsuranceBlock[]>(DEFAULT_INSURANCE_BLOCKS);

  useEffect(() => {
    setCustomQA(loadJSON(SCRIPTS_KEY, []));
    setOverrides(loadJSON(OVERRIDES_KEY, {}));
    setSopBlocks(loadJSON(SOP_KEY, DEFAULT_SOP_BLOCKS));
    setInsBlocks(loadJSON(INS_KEY, DEFAULT_INSURANCE_BLOCKS));
  }, []);

  // ── Scripts logic ─────────────────────────────────────────────────────────
  const allQA = useMemo(() => {
    const builtIn = QA_DATABASE.map(qa => overrides[qa.id] ? { ...qa, ...overrides[qa.id], isEdited: true } : qa);
    return [...builtIn, ...customQA];
  }, [customQA, overrides]);

  const results = useMemo(() => {
    let list = activeCategory !== "all" ? allQA.filter(qa => qa.category === activeCategory) : allQA;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(qa =>
        qa.keywords.some(k => k.includes(q)) ||
        qa.question.toLowerCase().includes(q) ||
        qa.script.toLowerCase().includes(q) ||
        qa.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, activeCategory, allQA]);

  const startInlineEdit = (qa: QA) => {
    setInlineEditId(qa.id);
    setInlineForm({ question: qa.question, script: qa.script, tips: qa.tips ?? "", followUp: qa.followUp ?? "" });
    if (expandedId !== qa.id) setExpandedId(qa.id);
  };
  const saveInlineEdit = (qa: QA) => {
    if (!inlineForm.question.trim() || !inlineForm.script.trim()) return;
    const patch = { question: inlineForm.question.trim(), script: inlineForm.script.trim(), tips: inlineForm.tips.trim() || undefined, followUp: inlineForm.followUp.trim() || undefined };
    if (qa.isCustom) {
      const updated = customQA.map(q => q.id === qa.id ? { ...q, ...patch } : q);
      setCustomQA(updated); saveJSON(SCRIPTS_KEY, updated);
    } else {
      const updated = { ...overrides, [qa.id]: { ...overrides[qa.id], ...patch } };
      setOverrides(updated); saveJSON(OVERRIDES_KEY, updated);
    }
    setInlineEditId(null);
  };
  const resetBuiltIn = (id: string) => {
    const updated = { ...overrides }; delete updated[id];
    setOverrides(updated); saveJSON(OVERRIDES_KEY, updated);
  };
  const saveNewScript = () => {
    if (!form.question.trim() || !form.script.trim()) return;
    const keywords = form.keywordsRaw.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
    const newQA: QA = { id: `custom-${Date.now()}`, isCustom: true, question: form.question.trim(), category: form.category, keywords, script: form.script.trim(), tips: form.tips.trim() || undefined, followUp: form.followUp.trim() || undefined };
    const updated = [...customQA, newQA];
    setCustomQA(updated); saveJSON(SCRIPTS_KEY, updated);
    setShowModal(false);
  };
  const deleteQA = (id: string) => {
    const updated = customQA.filter(qa => qa.id !== id);
    setCustomQA(updated); saveJSON(SCRIPTS_KEY, updated);
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  };

  // ── SOP logic ────────────────────────────────────────────────────────────
  const saveSopBlock = (id: string, title: string, body: string) => {
    const updated = sopBlocks.map(b => b.id === id ? { ...b, title, body } : b);
    setSopBlocks(updated); saveJSON(SOP_KEY, updated);
  };
  const addSopBlock = () => {
    const newBlock: SOPBlock = { id: `sop-custom-${Date.now()}`, title: "New SOP Section", body: "Edit this section..." };
    const updated = [...sopBlocks, newBlock];
    setSopBlocks(updated); saveJSON(SOP_KEY, updated);
  };
  const deleteSopBlock = (id: string) => {
    const updated = sopBlocks.filter(b => b.id !== id);
    setSopBlocks(updated); saveJSON(SOP_KEY, updated);
  };

  // ── Insurance logic ───────────────────────────────────────────────────────
  const saveInsBlock = (id: string, title: string, body: string) => {
    const updated = insBlocks.map(b => b.id === id ? { ...b, title, body } : b);
    setInsBlocks(updated); saveJSON(INS_KEY, updated);
  };
  const addInsBlock = () => {
    const newBlock: InsuranceBlock = { id: `ins-custom-${Date.now()}`, title: "New Insurance Section", body: "Edit this section..." };
    const updated = [...insBlocks, newBlock];
    setInsBlocks(updated); saveJSON(INS_KEY, updated);
  };
  const deleteInsBlock = (id: string) => {
    const updated = insBlocks.filter(b => b.id !== id);
    setInsBlocks(updated); saveJSON(INS_KEY, updated);
  };

  return (
    <div className="h-full flex overflow-hidden bg-slate-50">
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-52 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col py-5 px-3 gap-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">SOP & Scripts</p>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all ${
              section === s.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <s.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${section === s.id ? "text-white" : "text-slate-400"}`} />
            <div>
              <div className={`text-xs font-bold ${section === s.id ? "text-white" : "text-slate-800"}`}>{s.label}</div>
              <div className={`text-[10px] leading-tight ${section === s.id ? "text-blue-100" : "text-slate-400"}`}>{s.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── CALL SCRIPTS ── */}
          {section === "scripts" && (
            <motion.div key="scripts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                      <Phone className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-slate-900">Call Scripts</h1>
                      <p className="text-xs text-slate-500">Search by keyword · click any script to expand · pencil to edit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700">{allQA.length} scripts</span>
                    </div>
                    <button onClick={() => { setForm(BLANK_FORM); setShowModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Script
                    </button>
                  </div>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search by keyword, question, or topic..." value={query} onChange={e => setQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                  {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
                    <button key={id} onClick={() => setActiveCategory(id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${activeCategory === id ? `${color} border-current shadow-sm` : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                      <Icon className="w-3 h-3" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Script list */}
              <div className="flex-1 overflow-y-auto p-5">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <Search className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No scripts found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-4xl mx-auto">
                    <p className="text-xs text-slate-400 mb-3">{results.length} script{results.length !== 1 ? "s" : ""}{query && ` for "${query}"`}</p>
                    {results.map(qa => {
                      const isExpanded = expandedId === qa.id;
                      const isEditing = inlineEditId === qa.id;
                      const catColor = CAT_ICON_COLOR[qa.category] ?? "text-slate-500";
                      return (
                        <motion.div key={qa.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isEditing ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
                          <div className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                            onClick={() => { if (!isEditing) setExpandedId(isExpanded ? null : qa.id); }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${catColor}`}>{qa.category}</span>
                                {qa.isCustom && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200">Custom</span>}
                                {qa.isEdited && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Edited</span>}
                                {qa.keywords.slice(0, 3).map(kw => (
                                  <span key={kw} className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Tag className="w-2 h-2" />{kw}
                                  </span>
                                ))}
                              </div>
                              <p className="font-semibold text-slate-800 text-sm">{qa.question}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!isEditing && <button onClick={e => { e.stopPropagation(); startInlineEdit(qa); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>}
                              {qa.isEdited && !isEditing && <button onClick={e => { e.stopPropagation(); resetBuiltIn(qa.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Reset"><RotateCcw className="w-3.5 h-3.5" /></button>}
                              {qa.isCustom && !isEditing && <button onClick={e => { e.stopPropagation(); setDeleteConfirmId(qa.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
                              {!isEditing && (isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />)}
                            </div>
                          </div>
                          <AnimatePresence>
                            {(isExpanded || isEditing) && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                                  {isEditing ? (
                                    <>
                                      <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Question / Situation</label>
                                        <input type="text" value={inlineForm.question} onChange={e => setInlineForm({ ...inlineForm, question: e.target.value })}
                                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-1.5"><Phone className="w-3.5 h-3.5 text-blue-500" /><label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Phone Script</label></div>
                                        <textarea value={inlineForm.script} onChange={e => setInlineForm({ ...inlineForm, script: e.target.value })} rows={6}
                                          className="w-full px-3 py-2.5 text-sm border border-blue-200 bg-blue-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none leading-relaxed" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <div className="flex items-center gap-1.5 mb-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /><label className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pro Tip</label></div>
                                          <textarea value={inlineForm.tips} onChange={e => setInlineForm({ ...inlineForm, tips: e.target.value })} placeholder="Optional tip..." rows={3} className="w-full px-3 py-2 text-xs border border-amber-200 bg-amber-50 rounded-xl focus:outline-none resize-none" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-1.5 mb-1.5"><Check className="w-3.5 h-3.5 text-green-600" /><label className="text-xs font-bold text-green-700 uppercase tracking-wide">Follow Up</label></div>
                                          <textarea value={inlineForm.followUp} onChange={e => setInlineForm({ ...inlineForm, followUp: e.target.value })} placeholder="Optional follow-up..." rows={3} className="w-full px-3 py-2 text-xs border border-green-200 bg-green-50 rounded-xl focus:outline-none resize-none" />
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => setInlineEditId(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                                        <button onClick={() => saveInlineEdit(qa)} disabled={!inlineForm.question.trim() || !inlineForm.script.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 disabled:opacity-40">
                                          <Check className="w-3.5 h-3.5" /> Save
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div>
                                        <div className="flex items-center gap-2 mb-2"><Phone className="w-3.5 h-3.5 text-blue-500" /><span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Phone Script</span></div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{qa.script}</p>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        {qa.tips && (
                                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5"><Star className="w-3 h-3 text-amber-500" /><span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pro Tip</span></div>
                                            <p className="text-xs text-amber-900 leading-relaxed">{qa.tips}</p>
                                          </div>
                                        )}
                                        {qa.followUp && (
                                          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5"><Check className="w-3 h-3 text-green-600" /><span className="text-xs font-bold text-green-700 uppercase tracking-wide">Follow Up</span></div>
                                            <p className="text-xs text-green-900 leading-relaxed">{qa.followUp}</p>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── PHONE SOP ── */}
          {section === "sop" && (
            <motion.div key="sop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                    <ClipboardList className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-slate-900">Phone SOP</h1>
                    <p className="text-xs text-slate-500">Standard operating procedures for handling every phone call — click the pencil to edit any section</p>
                  </div>
                </div>
                <button onClick={addSopBlock} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-3 max-w-4xl mx-auto">
                  {sopBlocks.map(block => (
                    <EditableBlock key={block.id} block={block} onSave={saveSopBlock}
                      isCustom={block.id.startsWith("sop-custom")} onDelete={deleteSopBlock} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── INSURANCE INFO ── */}
          {section === "insurance" && (
            <motion.div key="insurance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-slate-900">Insurance Information</h1>
                    <p className="text-xs text-slate-500">Carrier contacts, verification steps, COB rules, and denial codes — click the pencil to edit any section</p>
                  </div>
                </div>
                <button onClick={addInsBlock} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-3 max-w-4xl mx-auto">
                  {insBlocks.map(block => (
                    <EditableBlock key={block.id} block={block} onSave={saveInsBlock}
                      isCustom={block.id.startsWith("ins-custom")} onDelete={deleteInsBlock} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Add Script Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Add Custom Script</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question / Situation <span className="text-red-500">*</span></label>
                  <input type="text" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="e.g. Parent asking about fluoride treatments"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white">
                      {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Keywords <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                    <input type="text" value={form.keywordsRaw} onChange={e => setForm({ ...form, keywordsRaw: e.target.value })} placeholder="fluoride, safe, toothpaste"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Script <span className="text-red-500">*</span></label>
                  <textarea value={form.script} onChange={e => setForm({ ...form, script: e.target.value })} placeholder='Write the exact script staff should say on the phone...' rows={5}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pro Tip <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea value={form.tips} onChange={e => setForm({ ...form, tips: e.target.value })} placeholder="Tone reminders, things to avoid..." rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Follow-Up Action <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea value={form.followUp} onChange={e => setForm({ ...form, followUp: e.target.value })} placeholder="What to do after the call ends..." rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={saveNewScript} disabled={!form.question.trim() || !form.script.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-40">Add Script</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
                <h3 className="font-bold text-slate-900">Delete this script?</h3>
              </div>
              <p className="text-sm text-slate-500 mb-5">This custom script will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={() => deleteQA(deleteConfirmId)} className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
