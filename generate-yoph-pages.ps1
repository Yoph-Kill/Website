$pages = @(
  @('portal','The Portal That Refuses A Map','A doorway with no architectural obligation. It opens toward more Yoph.','--glow:#8474ff;--hot:#ff6ba6;--acid:#b6ff78'),
  @('field-notes','Field Notes / soft evidence','Observations from the edge of a thing that declines to be named.','--glow:#54d5c2;--hot:#ff906b;--acid:#e9ff91'),
  @('constellation','The Constellation','A set of nearby stars, links, and almost-coordinates.','--glow:#6688ff;--hot:#d06bff;--acid:#9effd0'),
  @('archive','Archive of Present Tense','Nothing here is old. Some things have simply stopped moving.','--glow:#ff9f4d;--hot:#ff5f91;--acid:#dbff7a'),
  @('dispatch','Dispatch / no destination','A package moves through a room you cannot enter.','--glow:#ff6e6e;--hot:#8f9bff;--acid:#f3ed83'),
  @('manifesto','The Yoph Non-Manifesto','It is not a statement. It is the afterimage of a statement.','--glow:#c27dff;--hot:#6df1ff;--acid:#e5ff83'),
  @('index-of-elsewhere','Index of Elsewhere','A list that points confidently at its own margins.','--glow:#7db3ff;--hot:#fa7bce;--acid:#baffdb'),
  @('signal','Signal Room','Tune in to the frequency underneath the frequency.','--glow:#ffdf5d;--hot:#ff6f9c;--acid:#9df4ff'),
  @('manual','The Unofficial Manual','Instructions for using what is already using you.','--glow:#8dff8d;--hot:#a88cff;--acid:#fff275'),
  @('night-shift','Night Shift','Yoph after the ordinary lights have completed their argument.','--glow:#5368db;--hot:#bb6dff;--acid:#a5ffd1'),
  @('daybook','Daybook of Minor Weather','A day can be measured by the texture it leaves behind.','--glow:#ffb35c;--hot:#ff8aaf;--acid:#f3ff8c'),
  @('mirror','Mirror / adjacent','Not your reflection. The part that arrived a moment earlier.','--glow:#75e8ff;--hot:#d586ff;--acid:#deff9c'),
  @('room-00','Room 00','The room before the room. Keep your shoes on.','--glow:#9c85ff;--hot:#ff7f62;--acid:#d5ff78'),
  @('room-01','Room 01','A clean surface for unclear arrangements.','--glow:#69d7a4;--hot:#ff799f;--acid:#f0ff95'),
  @('room-03','Room 03','Four walls, five directions, one ongoing hum.','--glow:#c27cff;--hot:#ff729b;--acid:#a4f6ff'),
  @('room-04','Room 04','The lights are on for a reason that remains private.','--glow:#5da8ff;--hot:#ff9b68;--acid:#dcff8c'),
  @('room-05','Room 05','An empty room with exceptional timing.','--glow:#6fe0cc;--hot:#b77aff;--acid:#f0ff7e'),
  @('blueprint','Blueprint for a Soft Machine','A plan is a shape that has not decided to become real.','--glow:#64a4ff;--hot:#ff7fb9;--acid:#b6ff92'),
  @('afterimage','Afterimage Department','Look away carefully. Something remains.','--glow:#f17aff;--hot:#6de7ff;--acid:#e7ff83'),
  @('vocabulary','Yoph Vocabulary','A few words for conditions that prefer not to be conditions.','--glow:#8c80ff;--hot:#ff9275;--acid:#d6ff86'),
  @('glossary','Glossary of Nearness','Definitions are temporary architecture.','--glow:#63d5b9;--hot:#bd79ff;--acid:#f3ff7e'),
  @('patterns','Pattern Recognition','The pattern is visible. Recognition is optional.','--glow:#728bff;--hot:#f07bd1;--acid:#a4ffdb'),
  @('quiet-mode','Quiet Mode','A page for reducing the volume without leaving.','--glow:#86a4a8;--hot:#8a7fff;--acid:#d9ffbd'),
  @('bright-mode','Bright Mode','The same uncertainty with more surface area.','--glow:#ffd35c;--hot:#ff719a;--acid:#9afff0'),
  @('yoph-ai','Yoph AI / almost helpful','A synthetic lantern for questions with no recognized category.','--glow:#67e7ff;--hot:#9c7aff;--acid:#eaff83'),
  @('suite','The Suite','A collection of tools that remember the shape of your hand.','--glow:#a37aff;--hot:#ff7e74;--acid:#baff9b'),
  @('planner','Planner for Unfixed Things','Schedule the moment before the moment.','--glow:#74e0bd;--hot:#f878b0;--acid:#f3ff89'),
  @('paint','Paint / surface study','Color is a door with no handle.','--glow:#ff766e;--hot:#bd7bff;--acid:#baff88'),
  @('word','Yoph Word','Words become stranger when they are given room.','--glow:#789cff;--hot:#ff8d73;--acid:#ddff8e'),
  @('x','Yoph on X','The signal condenses into a post-shaped aperture.','--glow:#8c8caa;--hot:#ff6fa7;--acid:#d8ff88'),
  @('facebook','Yoph on Facebook','A familiar window with an unfamiliar temperature.','--glow:#6789ff;--hot:#70dcff;--acid:#d9ff87'),
  @('discord','Yoph on Discord','The room is open. The room is already speaking.','--glow:#7a7aff;--hot:#ff79b5;--acid:#bbff9d'),
  @('youtube','Yoph on YouTube','Moving images for still questions.','--glow:#ff5d70;--hot:#a67cff;--acid:#e8ff8a'),
  @('suno','Yoph on Suno','Sound belongs in the hands of the moment.','--glow:#ff9a61;--hot:#ff70c8;--acid:#d3ff8c'),
  @('hub','Yoph Hub','The hub is not central. It is merely well lit.','--glow:#79d6ff;--hot:#957bff;--acid:#d9ff83'),
  @('gallery','Gallery of Unfinished Light','Every image is a window that forgot its subject.','--glow:#e581ff;--hot:#6bcdff;--acid:#e4ff91'),
  @('logbook','Logbook / open','A place to put the thing that keeps recurring.','--glow:#7ed0a8;--hot:#ff8b6b;--acid:#f0ff8d'),
  @('loading','Loading Yoph','Please wait while the unclear becomes available.','--glow:#aa80ff;--hot:#ff71a9;--acid:#b4ffdb'),
  @('endless','Endless Page','The ending is a format, not a location.','--glow:#5d8fff;--hot:#ff6f7a;--acid:#dfff84')
)
New-Item -ItemType Directory -Force pages | Out-Null
$longNotes = @(
  "The first record arrived without a sender. It described a room in which the walls had started keeping time. We have kept the record because it was precise about everything except the important part.",
  "Somewhere between an instruction and a memory, this fragment acquired a pulse. Read it slowly. The useful meaning is likely to appear beside the words, not inside them.",
  "Yoph has always preferred the side entrance: the unfinished sentence, the half-lit tool, the link that looks accidental until it has taken you somewhere. This page is another side entrance.",
  "There is a practical reason for this page, though it may not be the reason you notice first. Follow the color, follow the empty space, or simply stay until the layout becomes familiar."
)
$captions = @("a note left under glass", "inventory of a passing condition", "the part that would not archive", "a small instrument for distance", "where the signal changes temperature", "not an answer, but a useful angle")
$flavors = @("confetti", "orbit", "sticker", "tape", "bubble", "zigzag")
$whimsy = @("tiny ceremony in progress", "orbiting a thought", "please admire responsibly", "held together with excellent tape", "a bubble with paperwork", "the zigzag is intentional")
$features = @{
  'yoph-ai' = @('../Website Assets/Ai-Profile-Hero1.png','synthetic portrait / 01','The lantern has a face today','It answers in gradients, pauses, and suspiciously good timing. Ask it something small before trusting it with anything larger.')
  'gallery' = @('../Website Assets/Profile-Hero.png','portrait / found surface','A face for the unfinished light','This image was placed here because it looked like it had already visited three other pages. It declined to explain where it was going next.')
  'afterimage' = @('../Website Assets/Ai-Profile-Hero2.png','afterimage / retained signal','Look away, then look again','The second portrait is not a copy. It is what the first portrait remembers after the room changes color.')
  'hub' = @('../Website Assets/YophGoogleBusImage.png','transit object / route unknown','The bus is going somewhere adjacent','Board through the nearest link. There may be a stop, but there is definitely a view.')
  'store' = @('../Website Assets/Badge.png','official-ish mark / inventory','One badge, several explanations','A small emblem for people who enjoy carrying an unresolved symbol into otherwise ordinary places.')
  'paint' = @('../Website Assets/yoph-ai-preview-image.gif','moving study / color behaving','The surface refuses to stay still','Watch the color make a decision, regret it, and call the result a composition.')
}
foreach ($p in $pages) {
  $i = [array]::IndexOf($pages, $p); $slug=$p[0]; $title=$p[1]; $desc=$p[2]; $theme=$p[3]
	$note = $longNotes[$i % $longNotes.Count]; $caption = $captions[$i % $captions.Count]; $variant = $i % 6; $flavor = $flavors[$i % $flavors.Count]; $whimsyLine = $whimsy[$i % $whimsy.Count]
  $class = @('page-editorial','page-notebook','page-poster','page-terminal','page-split','page-gallery')[$variant]
  $class = "$class flavor-$flavor"
	$nav = '<header class="sitebar wrap"><a class="brand" href="../index.html">yo<span>ph</span></a><span class="signal">' + $caption + '</span></header>'
	$spark = '<div class="whimsy-mark reveal" aria-label="' + $whimsyLine + '"><span aria-hidden="true">✦</span> ' + $whimsyLine + '</div>'
	$feature = ''
  if ($features.ContainsKey($slug)) {
	$f = $features[$slug]
	$feature = "<section class=`"feature-card reveal`"><figure><img src=`"$($f[0])`" alt=`"$($f[1])`"><figcaption>$($f[1])</figcaption></figure><div><p class=`"eyebrow`">$($f[1])</p><h2>$($f[2])</h2><p>$($f[3])</p><a class=`"btn`" href=`"contact.html`">send a small reaction →</a></div></section>"
  }
  if ($variant -eq 0) {
	$body = @"
 <main class="wrap"><section class="hero"><p class="eyebrow reveal">dispatch / $slug</p><h1 class="reveal">$title</h1><p class="lede reveal">$desc</p><div class="actions reveal"><a class="btn primary" href="../index.html">leave a trace</a><a class="btn" data-random-link href="portal.html">read past this</a></div></section>$feature<section class="essay reveal"><div><p>$note</p><p>It is not x, it is the space where x has been expected for too long. The page keeps the expectation and removes the obligation. What remains is a slower kind of attention, a place for vague wording to become texture.</p><p>Keep this open beside something ordinary. A message, a window, a cup, a task you have postponed. Yoph is less interested in escape than in the small alteration of returning.</p></div><aside><p class="eyebrow">margin note</p><p>Nothing here is a solution. It is a surface with enough depth to make a question look deliberate.</p><a href="field-notes.html">compare the evidence →</a></aside></section></main>
"@
  } elseif ($variant -eq 1) {
	$body = @"
 <main class="wrap"><section class="hero"><p class="eyebrow reveal">notebook / entry $($i.ToString('00'))</p><h1 class="reveal">$title</h1><p class="lede reveal">$desc</p></section>$feature<section class="note-stack"><article class="note reveal"><p class="eyebrow">09:14 / first observation</p><h3>The arrangement looked accidental.</h3><p>$note</p><p>There was no central object, only a series of things refusing to be background. A word. A gap. A button with no appetite for being pressed. I wrote it down before the feeling could become useful.</p></article><article class="note reveal"><p class="eyebrow">13:02 / correction</p><h3>Do not call it a system yet.</h3><p>The page is not asking to be understood all at once. Let one sentence remain unresolved. The unresolved sentence is doing most of the work.</p><a class="btn" href="archive.html">file this elsewhere</a></article><article class="note reveal"><p class="eyebrow">22:48 / final mark</p><h3>Still here, changed slightly.</h3><p>Yoph does not conclude. It leaves a mark in the margin and points toward weather, distance, or another room.</p><a href="../weather.html">look outside →</a></article></section></main>
"@
  } elseif ($variant -eq 2) {
	$body = @"
 <main class="wrap"><section class="hero"><p class="eyebrow reveal">public notice / $slug</p><h1 class="reveal">$title</h1><p class="lede reveal">$desc</p><div class="actions reveal"><a class="btn primary" href="../index.html">enter the notice</a><a class="btn" href="store.html">inspect the object</a></div></section>$feature<section class="poster-columns"><article class="reveal"><h3>ONE</h3><p>The signal does not need to be loud to remain present. Carry this sentence into the next room.</p></article><article class="reveal"><h3>TWO</h3><p>$note</p></article><article class="reveal"><h3>THREE</h3><p>Not a joke. Not a product. Not a clear explanation. A serious arrangement of uncertain edges.</p></article><article class="reveal"><h3>FOUR</h3><p><a href="contact.html">leave a response →</a></p></article></section></main>
"@
  } elseif ($variant -eq 3) {
	$body = @"
 <main class="wrap"><section class="hero"><p class="eyebrow reveal">yoph shell / process $($i.ToString('00'))</p><h1 class="reveal">$title</h1><p class="lede reveal">$desc</p><div class="console reveal"><p>loading subject: $slug</p><p>received note: $note</p><p>status: unresolved / stable</p><p>next: follow a link that was not selected</p></div><div class="actions reveal"><a class="btn primary" href="../index.html">run threshold</a><a class="btn" data-random-link href="archive.html">execute elsewhere</a></div></section>$feature<section class="grid"><article class="panel reveal"><p class="eyebrow">output</p><h3>Meaning has no permission to finish.</h3><p>Read the page as a tool, a log, or a quiet screen. The interface is not hiding anything; it is simply refusing to prioritize it.</p></article><article class="panel reveal"><p class="eyebrow">warning</p><h3>Do not optimize the strange part.</h3><p>Some systems are valuable because they waste the exact amount of time needed to notice your own attention.</p><a href="manual.html">open manual →</a></article></section></main>
"@
  } elseif ($variant -eq 4) {
	$body = @"
 <main class="wrap"><section class="hero"><p class="eyebrow reveal">left field / $slug</p><h1 class="reveal">$title</h1><p class="lede reveal">$desc</p><div class="actions reveal"><a class="btn primary" href="../index.html">cross the divide</a><a class="btn" href="../weather.html">measure the outside</a></div></section>$feature<section class="split-body"><article class="panel reveal"><p class="eyebrow">a longer thought</p><h3>The page has two temperatures.</h3><p>$note</p><p>One belongs to the words: measured, slightly formal, pretending to know where the sentence will end. The other belongs to the empty area beside them. That is where Yoph keeps its more durable material.</p></article><article class="panel reveal"><p class="eyebrow">a smaller thought</p><h3>Keep the distinction soft.</h3><p>It is not x, it is the interval in which x becomes visible. Save the link if you need to. Forget it if you do not.</p><a href="mirror.html">visit the adjacent reflection →</a></article></section></main>
"@
  } else {
	$body = @"
 <main class="wrap"><section class="hero"><p class="eyebrow reveal">exhibit / $slug</p><h1 class="reveal">$title</h1><p class="lede reveal">$desc $note</p></section>$feature<section class="gallery-wall"><article class="tile reveal"><h3>the image that stayed</h3><p>Profile, surface, afterimage.</p></article><article class="tile reveal"><h3>01</h3><p>Every object is almost a clue.</p></article><article class="tile reveal"><h3>02</h3><p>Every clue is allowed to be decorative.</p></article><article class="tile reveal"><h3>03 / open wall</h3><p>Look longer. The composition is changing because you are in it.</p></article></section><div class="actions reveal"><a class="btn primary" href="gallery.html">continue the exhibition</a><a class="btn" data-random-link href="archive.html">remove yourself from the room</a></div></main>
"@
  }
	$html = @"
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="$desc"><title>$title / Yoph</title><link rel="stylesheet" href="../styles.css"></head><body class="$class" style="$theme">$nav$spark$body<footer class="wrap"><p><a href="store.html">store-adjacent</a> · <a href="contact.html">contact-ish</a> · <a href="../index.html">return almost home</a></p></footer><script src="../script.js"></script></body></html>
"@
  Set-Content -Path "pages/$slug.html" -Value $html -Encoding utf8
}
