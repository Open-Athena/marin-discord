## <#1365044508546568372> — MoE Scaling & Architecture

The week's most active workstream by far. willheld shared a [WandB report](https://marin-discord.pages.dev/#1365044508546568372/1488351964986085507) tracking the 1e22 MoE vs 1e23 dense comparison — MoEs looking competitive. Kaiyue-Wen [discovered dead/underloaded experts](https://marin-discord.pages.dev/#1365044508546568372/1488924389050290276) on Layer 3, sparking deep investigation.

Larry pulled router weights and found that [router vectors start orthogonal then reach ~60% cosine similarity](https://marin-discord.pages.dev/#1365044508546568372/1489131651920564244) during training — astronomically unlikely by chance in d3200 space. The team debated fixes: row-wise norm constraints, small LBL coefficients, and unconstrained Adam for routers (as in HyperP). Larry's routing analysis showed the [two underloaded experts at ~70% average load](https://marin-discord.pages.dev/#1365044508546568372/1489356958967398480) — not fully dead, possibly reflecting natural Zipfian token distribution.

Pranshu Chaturvedi ran sweeps with QB load balancing + Latent MoE + Ring EP ([marin-community/marin#4304](https://github.com/marin-community/marin/issues/4304)), hitting router entropy collapse at 520M and 1.2B scales. Reducing LR by 4x stabilized loss but didn't isolate the cause. dlwh directed the team to [isolate Latent MoE at 1e19 flops](https://marin-discord.pages.dev/#1365044508546568372/1489422099360780369) against the current best formula. Pranshu's [1e19 results](https://marin-discord.pages.dev/#1365044508546568372/1490772930802483270) showed Latent MoE hurts BPB at d768/d1024, with only ~1% degradation at d1536 ([marin-community/marin#4032](https://github.com/marin-community/marin/issues/4032)). dlwh noted it doesn't need to win on TPU — loss-neutral with good GPU inference properties would suffice.

Larry reported [optimal LR is highly predictable](https://marin-discord.pages.dev/#1365044508546568372/1490064607442764017) (R²=0.995) as a function of batch size, token count, and model size ([marin-community/marin#4225](https://github.com/marin-community/marin/issues/4225#issuecomment-4187586276)).

## <#1364827114670657616> — Infrastructure

Russell Power [restarted the cluster](https://marin-discord.pages.dev/#1364827114670657616/1489051821451247747) early in the week. The v4-512 big-run slice hit a non-deterministic peer error; dlwh diagnosed it as [cross-thread JAX kernel invocations](https://marin-discord.pages.dev/#1364827114670657616/1489364324211232858) and recommended nuking/recreating. willheld [documented the restart incantations](https://marin-discord.pages.dev/#1364827114670657616/1489427643463110778) for future reference.

GCS storage costs are a major concern — Russell reported [~$60k/month](https://marin-discord.pages.dev/#1364827114670657616/1490767485547319388), mostly from standard storage class. Checkpoints are the biggest contributor; Larry noted [default jobs save 50 permanent copies](https://marin-discord.pages.dev/#1364827114670657616/1490769245645181178) for a 50k-step run. Russell's plan: [enable soft-delete for 3 days, delete per David's criteria, restore if needed](https://marin-discord.pages.dev/#1364827114670657616/1490770787014148317). Ahmed raised concerns about [research experiment baselines being deleted](https://marin-discord.pages.dev/#1364827114670657616/1490771304188481657); Russell clarified it targets old data not on the protect list.

Eric Czech hit the `device_put` [fully-addressable array error](https://marin-discord.pages.dev/#1364827114670657616/1490337486944080042) on v4-32s for lm_eval ([marin-community/marin#2417](https://github.com/marin-community/marin/issues/2417)). Ahmed flagged [CI/CD failures on CoreWeave](https://marin-discord.pages.dev/#1364827114670657616/1490415132495315086) blocking PRs ([marin-community/marin#4433](https://github.com/marin-community/marin/issues/4433)); Russell confirmed it's a known issue. Jeff H suggested it may be [time to move to Iris](https://marin-discord.pages.dev/#1364827114670657616/1490717706167648409) per the Ray sunset plan ([marin-community/marin#4269](https://github.com/marin-community/marin/issues/4269)). romain is scoping a [JAX 0.9.2 upgrade](https://marin-discord.pages.dev/#1364827114670657616/1490787265213894908) on top of Ahmed's vLLM/TPU work.

## <#1375005693899309126> — Scaling Suite

The 1e23 dense run [completed](https://marin-discord.pages.dev/#1375005693899309126/1488327970149109911), with willheld sharing [forecasting results](https://marin-discord.pages.dev/#1375005693899309126/1488568896171540540) that look strong despite training spikes — dlwh called it "truly incredible." willheld speculated there may be [small-scale phenomena that predict later spikes](https://marin-discord.pages.dev/#1375005693899309126/1488577736321667133). Cross-seed consistency also [confirmed](https://marin-discord.pages.dev/#1375005693899309126/1489041398861795441). Percy asked about [GPT-5 estimate sourcing](https://marin-discord.pages.dev/#1375005693899309126/1489104724899790922) from Epoch AI's benchmarks.

## <#1374989195109466122> — Reinforcement Learning

Ahmed celebrated the RL pipeline [running stable for 500+ steps on Iris](https://marin-discord.pages.dev/#1374989195109466122/1488587179620962464) — previously dying around 200 steps ([marin-community/marin#2385](https://github.com/marin-community/marin/issues/2385)). This is an infra milestone, not yet a quality win. Next steps: tuning hyperparameters, fixing the loss function, and systematic experimentation now that stability is solved.

## <#1366632114316906506> — Code Talk

Ahmed found a [silent bug affecting all Llama 3 models on vLLM](https://marin-discord.pages.dev/#1366632114316906506/1489495767130443857) — checkpoints were being read as Mistral models, triggering sliding window attention at context >4096. Fix: delete and re-download the GCS cache. dlwh's bot (dlwh-golem) got a [UX improvement](https://marin-discord.pages.dev/#1366632114316906506/1489430590246748252): managed TL;DR blocks on issues now use a robot emoji heading ([marin-community/marin#4377](https://github.com/marin-community/marin/pull/4377)). willheld explored [SWE-Rebench docker environments](https://marin-discord.pages.dev/#1364827114670657616/1489482654142173275) for code evaluation — Russell recommended spawning Iris jobs per environment rather than Docker-in-Docker ([marin-community/marin#4383](https://github.com/marin-community/marin/issues/4383)).

## <#1365058937589858324> — Code Review

Key PRs: Ahmed's [automated alignment pipeline](https://marin-discord.pages.dev/#1365058937589858324/1488433788714356897) and [RL-to-Iris migration](https://github.com/marin-community/marin/pull/3960); Michael Ryan's [Qwen3.5 model support](https://github.com/marin-community/marin/pull/4327) for Levanter; Russell's [Iris priorities](https://github.com/marin-community/marin/pull/4096) and [breadcrumb docs](https://github.com/marin-community/marin/pull/4321) experiments; Ahmed's [CPU VMs for TPU zones](https://github.com/marin-community/marin/pull/4343).

## <#1435065934992773221> — SFT & Agents

Ahmed and Kevin Xiang Li [laid out a plan](https://marin-discord.pages.dev/#1435065934992773221/1489452658929701044) for evaluating Marin 32B on coding tasks (SWE-Bench, Terminal Bench 2) post-training, bracketing model performance in ascending order of training time. Kevin also flagged [SWE-ZERO](https://github.com/marin-community/marin/issues/4435) as a cheap way to scale agentic traces.

## <#1356490712199462912> — Scaling Laws

Eric Czech [investigated why Delphi's Approach 2 loss forecasts were so accurate](https://marin-discord.pages.dev/#1356490712199462912/1488870819349270660) despite the team's own paper suggesting Approach 2 shouldn't be used, comparing against Approach 3 and Llama 3 as reference.

## <#1462895580064911522> — Data Mixing

yurusankyo shared [updated GRP convergence plots](https://marin-discord.pages.dev/#1462895580064911522/1489763655305265263) as sample counts increase.

## <#1357057383830126652> — Community

Notable new members: [Greg Lindahl](https://marin-discord.pages.dev/#1357057383830126652/1488478219026956349) (CTO, Common Crawl Foundation — 20 reactions); Nathan TeBlunthuis (UT Austin, studying open AI governance); Swagatam (ELLIS Tübingen, MoE scaling laws for OpenEuroLLM); Duck Quang (MIT CSAIL); Allen (CS336 student). 28 new joins in the welcome room.

## News & Research

- [HPLT v3.0 dataset](https://marin-discord.pages.dev/#1356487690559684638/1488348448766824531) — large multilingual web crawl, potentially more exhaustive than Nemotron
- [Steepest descent convergence bounds formalized in Lean](https://marin-discord.pages.dev/#1356487690559684638/1488354034547953685) by leloy! — hyperparameter scaling laws from first principles
- [MuonH spotted](https://marin-discord.pages.dev/#1356487690559684638/1488550770763890850) in the wild
- [Gemma 4 released](https://marin-discord.pages.dev/#1356487690559684638/1489296281141510204) by Google
- <https://arxiv.org/abs/2603.26554> shared by willheld
- <https://arxiv.org/abs/2604.01411> — work by Nicholas Roberts et al., flagged for rohithck
