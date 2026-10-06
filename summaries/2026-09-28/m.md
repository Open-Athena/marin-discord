## <#1374989195109466122> — Reinforcement Learning

Harshit Varma reported [SFT gains](https://discord.com/channels/1354881461060243556/1374989195109466122/1554296222884302988) on TB-lite (+13.5pp) and TB2.0 (+3pp), finding MSA works better than Terminus-2 for SFT and that Rejection Fine-Tuning helps but saturates. Benjamin Feuer shared an [anti-looping PRM callback](https://discord.com/channels/1354881461060243556/1374989195109466122/1554521977392201739) in MSkyRL's `gym` entrypoint to penalize doom loops during RL runs. He also applied Liquid AI's [antidoom](https://github.com/Liquid4All/antidoom/tree/bd6a126476e18554b0cacaea3fd9f258fdde1f97) method (adapted from [AntiSlop](https://arxiv.org/abs/2510.15061)) using FTPO to [eliminate doom looping](https://discord.com/channels/1354881461060243556/1374989195109466122/1555649871216910390) from Snowball, receiving enthusiastic praise from dlwh.

dlwh shared Benjamin Feuer's [RL data catalogue dashboard](https://discord.com/channels/1354881461060243556/1374989195109466122/1554574114415452250) unifying quality, difficulty, and metadata across all RL data sources. lukedhlee [submitted coding agent SFT datasets](https://discord.com/channels/1354881461060243556/1374989195109466122/1555312577746047069) for Snowball 09-21, achieving SWE-bench scores of 45-47% (up from 13.8% base) using CalibForge relay traces and Kimi SWE-smith traces.

dlwh proposed an [`eject_button` tool](https://discord.com/channels/1354881461060243556/1374989195109466122/1555001234102951997) to let agents opt out of impossible tasks, with Russell Power agreeing it's a great idea. The approach would mark known-impossible tasks as having eject as the correct answer. Benjamin Feuer also published a [Snowball family tree](https://discord.com/channels/1354881461060243556/1374989195109466122/1556365016721002506) documenting the lineage of all Snowball 67B A2B checkpoints. RL meetings were rescheduled to Mondays at 9am.

## <#1516150256499163166> — MarinFold

Tim O'Donnell posted the [weekly MarinFold update](https://discord.com/channels/1354881461060243556/1516150256499163166/1554210720353230950). The first delta-stream training run finished with R-precision of **0.576** vs **0.511** for the matched contacts-v1 experiment ([#299](https://github.com/Open-Athena/MarinFold/issues/299)), promising enough that Zack launched a full-corpus version. The [complex corpus](https://huggingface.co/buckets/open-athena/MarinFold/tree/data/document_structures/contacts_v1_complex) was published with 3.41M documents / 11.15B tokens including 611K heterodimers and 2.80M homodimers ([#294](https://github.com/Open-Athena/MarinFold/issues/294)). Varying contact counts improved Helico GDT-TS from 0.502 to 0.528, though oracle reaches 0.624 making ranking a bottleneck ([#311](https://github.com/Open-Athena/MarinFold/issues/311)). Several diversity-oriented inference experiments (contact cluster branching, medoid branching, alanine masking) all failed their preregistered gates ([#326](https://github.com/Open-Athena/MarinFold/issues/326), [#328](https://github.com/Open-Athena/MarinFold/issues/328), [#333](https://github.com/Open-Athena/MarinFold/issues/333)).

zwn and Tim O'Donnell [discussed](https://discord.com/channels/1354881461060243556/1516150256499163166/1554219388138295490) the ESMFold2 R-precision evaluation, clarifying it uses experimentally-determined PDB structures (not predicted ones) for ground truth. Furkan suggested entering the [Anthropic Adaptyv 2026 competition](https://proteinbase.com/competitions/anthropic-adaptyv-2026), and Tim O'Donnell [expressed interest](https://discord.com/channels/1354881461060243556/1516150256499163166/1554229750489161800) in using Marin models to orchestrate a protein design campaign via a harness like [T-REX](https://www.biorxiv.org/content/10.64898/2026.09.22.753604v2).

## <#1380235124011958313> — Long Context

dlwh [flagged](https://discord.com/channels/1354881461060243556/1380235124011958313/1554236451577794711) that Snowball SFT's long-context performance is significantly behind Qwen 3.6-35B-A3B. MRCR scores are **18.3** for Snowball 09-21 vs **92.7** for Qwen ([marin#9412](https://github.com/marin-community/marin/issues/9412)). Evidence suggests SFT likely damaged long-context ability, which dlwh noted is "easier to fix" ([marin#9519](https://github.com/marin-community/marin/issues/9519)).

On graphwalks, Snowball scores [0.06 vs Qwen's 0.5](https://discord.com/channels/1354881461060243556/1380235124011958313/1554562767057321985). Error analysis revealed the model [over-reasons and restates edge lists](https://discord.com/channels/1354881461060243556/1380235124011958313/1554565952946044980) until running out of tokens — when it does finish, it gets F1 of 0.9. Doubling max response length only bumped the score to 0.14, suggesting doom looping rather than just length limits. willheld noted the newest eval policy data doesn't show many truncations on MRCR specifically.

## <#1354881461060243561> — Community Meeting & General

Percy Liang [announced](https://discord.com/channels/1354881461060243556/1354881461060243561/1554288027029999707) the Marin community meeting (Tuesday Sept 29), where rav, Mark, and mcwitt presented on co-designing the model architecture with kernels to fit hardware for the hero run. Percy shared [slides and recording](https://discord.com/channels/1354881461060243556/1354881461060243561/1554697246174613506), and rav posted a [blog post on expert parallelism](https://openathena.ai/blog/expert-parallelism/). Anthony Platanios volunteered to work on a metadata-only task.

## <#1527756652890161292> — Architecture

Kaiyue-Wen shared a [two-tower decoder paper](https://arxiv.org/abs/2609.27294) that sparked interest from Larry. Wenhao Chai [tested sofamax](https://discord.com/channels/1354881461060243556/1527756652890161292/1554506993287299082) in Marin based on Kaiyue-Wen's muonh baseline, reporting 1.1-1.3× speedup that matches final performance. Larry noted the TPS boost will decay with more layers, and speculated about very large vocab sizes (100M) potentially crowding out residual stream space.

## <#1376621616531902554> — Ideas

Sway shared [CombinatorialBPE](https://github.com/SwayStar123/CombinatorialBPE), a factorized tokenizer that decomposes tokens into (case, prefix, core, suffix) with ~40k learned affixes in a 128k vocab. dlwh [suggested comparing](https://discord.com/channels/1354881461060243556/1376621616531902554/1554521246652170423) with TokenMonster. Separately, TheWizard [asked](https://discord.com/channels/1354881461060243556/1376621616531902554/1555629617488859237) whether the team is collecting agent traces from internal Marin development work for RL post-training.

## <#1555304855822794882> — Marin for Science

Tim O'Donnell [created this new channel](https://discord.com/channels/1354881461060243556/1555304855822794882/1555306288114565261) for efforts to improve Marin models on biology and scientific tasks, inviting Kevin Jablonka to run chemistry benchmarks on a [Snowball pre-release checkpoint](https://huggingface.co/open-athena/Snowball-67B-A2B-5.7T-Mixed-RLVR-Step38). Steven Dillmann from Terminal-Bench-Science [proposed](https://discord.com/channels/1354881461060243556/1555304855822794882/1555339768953569430) creating a TB-Science Lite set from tasks that are too easy for frontier models but useful for open LLM eval.

## <#1356487738840318002> / <#1366632114316906506> — Evals & Code

Benjamin Feuer shared a [draft eval policy update](https://discord.com/channels/1354881461060243556/1356487738840318002/1555905198013030531) with significant changes: Terminal-Bench 2.0→2.1 with 65k context and 3 trials per task, AIME24 standardized grader with 10 trials, and SWE-bench additions. willheld posted a [plan for testing eval policy correlation](https://discord.com/channels/1354881461060243556/1366632114316906506/1555010427572719698) with AA-II. dlwh is [wrestling with](https://discord.com/channels/1354881461060243556/1366632114316906506/1554980905527943248) how TaskCompendium should handle non-shell tool environments (calendars, web search, etc.), noting many are stateful and grading depends on that state.

## <#1365058937589858324> / <#1357080963472949428> — Infra & Code Review

RedSpidey submitted [PR #9617](https://github.com/marin-community/marin/pull/9617) to fix the quality classifier being host-bound, using double-buffered tokenization and numpy lookups to cut scoring time from 30-32s to 21-22s on CPU and 33-34s to 28-31s on A100. Mark [explained](https://discord.com/channels/1354881461060243556/1357080963472949428/1555593953536118865) the team's DCLM/FineWeb-inspired quality scoring pipeline, noting that small models' poor MFU means you can scale FLOPs without proportional wall-clock cost.

## News & Research

- willheld shared a [tokenization survey](https://discord.com/channels/1354881461060243556/1356487690559684638/1554876525000658984) from catherinearnett et al. coordinated via Discord
- willheld flagged a [Pangram paper](https://arxiv.org/abs/2609.40295)
- dlwh [noted](https://discord.com/channels/1354881461060243556/1356487690559684638/1555278018484899853) AI2's training-stack release, identifying integrated MXFP8 as the main gap vs Marin's current stack
- Eric shared a [preprint on PE hybrids](https://arxiv.org/abs/2609.38530) showing sliding-window RoPE + global NoPE shifts retrieval mechanisms and explains long-context gains
- yurusankyo spotted Aleph Alpha's [tech report](https://aleph-alpha.com/downloads/tech-report.pdf) as another Olmix user
- André Martins (IST Lisbon, EuroLLM) and aquajet (ex-EleutherAI) introduced themselves, both looking to contribute
