## <#1374989195109466122> — RL & Post-Training

karansag shared [detailed experiments comparing MOPD, SFT, and weight-merging](https://discord.com/channels/1354881461060243556/1374989195109466122/1559686719094259742) for the Snowball 67B-A2B campaign, inspired by [a paper showing SFT with rejection sampling outperforms MOPD](https://arxiv.org/abs/2610.04272). marianna13 posted [recovery SFT results](https://discord.com/channels/1354881461060243556/1374989195109466122/1559640375134789764) on the antidoom model, showing slight improvement over the Sept 21 Grug baseline after SFT. Ahmed M Ahmed [raised the topic of score centering](https://discord.com/channels/1354881461060243556/1374989195109466122/1560784136484954122) for RLVR, pointing to a branch on [PR #9291](https://github.com/marin-community/marin/pull/9291) and noting KL blowup before entropy collapse in v2 metrics. New contributor Zoey Li introduced herself with a thorough review of the Snowball RLVR campaign. _Vitiate (Xiaoyuan) [reported that 37 of 58 IFBench instruction types have defects](https://discord.com/channels/1354881461060243556/1374989195109466122/1561233998091649064) in the checkers Marin uses through Evalchemy, with 31 still defective upstream.

## <#1540486417078296576> — Hero Run Updates

mcwitt announced that the [hero run would be paused for a QK multiplier sweep](https://discord.com/channels/1354881461060243556/1540486417078296576/1559689735386169484) to determine optimal settings for the upcoming 4k→16k context length switch ([issue #9615](https://github.com/marin-community/marin/issues/9615)). Larry shared [prompt completions from the pretrain checkpoint](https://discord.com/channels/1354881461060243556/1540486417078296576/1560906403898458215) and separately submitted a [PR to delete every other hero checkpoint](https://github.com/marin-community/marin/pull/10218/changes) to free S3 storage.

## <#1527756652890161292> — Architecture Experiments

Larry reported that [KDA + attention residuals + MLA + relative position embedding is now running at 25.5% MFU](https://discord.com/channels/1354881461060243556/1527756652890161292/1559076820626964593) on a single-rack hero-scale configuration. Kaiyue-Wen noted plans to [explore more sparse computation](https://discord.com/channels/1354881461060243556/1527756652890161292/1559464507036794921) and later flagged [a new CPLM paper](https://arxiv.org/abs/2610.19247v1) whose [gains look "really shocking"](https://discord.com/channels/1354881461060243556/1527756652890161292/1560932480561979494), though scalability and TPU reproducibility remain open questions.

## <#1365058937589858324> — Code Review & VLM

TheWizard opened [PR #10076](https://github.com/marin-community/marin/pull/10076) to [introduce vision modality to Levanter](https://discord.com/channels/1354881461060243556/1365058937589858324/1559767606519537744), including data loaders and SigLip encoder architectures — the first in a series of VLM PRs. dlwh [clarified the boundary](https://discord.com/channels/1354881461060243556/1365058937589858324/1559804413412122665): reference models belong in Levanter, while new/experimental work should use grug-style templates for faster agent-driven iteration. rav tagged Russell Power for review on [PR #10089](https://github.com/marin-community/marin/pull/10089).

## <#1484315476325826660> — OpenThoughts-Next Data

Franziska Weindel shared a [comprehensive V1 data update](https://discord.com/channels/1354881461060243556/1484315476325826660/1560416324289695838): 42,166 patched tasks across 8 data sources with cached Apptainer images, including Marin Harbor compatibility checks, setup repairs, reference checks, and rule-based exclusions. She also reported on [LLM-as-judge filtering trials](https://discord.com/channels/1354881461060243556/1484315476325826660/1560416438273970236) using Terminal-Bench/Harbor rubrics with Opus 5.5 — no reviewed task passed every criterion, indicating rubrics need refinement. marianna13 proposed [splitting into two parallel teams](https://discord.com/channels/1354881461060243556/1484315476325826660/1560248932888617081): one on Snowball (fully open) and one on Qwen (more capable). Charlie R posted a [comparison of the 550B Hero run to other OSS base checkpoints](https://discord.com/channels/1354881461060243556/1484315476325826660/1559295312101904474) ([issue #8824](https://github.com/marin-community/marin/issues/8824)).

## <#1355318637854199848> — SFT & Training Infra

marianna13 [validated the Levanter SFT launcher on Marenostrum](https://discord.com/channels/1354881461060243556/1355318637854199848/1559201860211179564), reporting Levanter is 2x faster than Megatron, and shared scripts and setup details. dlwh [approved](https://discord.com/channels/1354881461060243556/1355318637854199848/1559289367695073383) with a "notbad.jpg." karansag cross-posted his MOPD/SFT/weight-merging comparison results to the SFT channel as well.

## <#1356487738840318002> — Evals & Benchmarks

Benjamin Feuer [launched the new canonical eval policy for the Snowball release](https://discord.com/channels/1354881461060243556/1356487738840318002/1560667278813569158), including job failure rates and infrastructure error rates — notably, Harbor benchmarks like τ³-bench showed >15% job failure rates. He also introduced [HallBench](https://discord.com/channels/1354881461060243556/1356487738840318002/1560676009500741765), an LLM comparator app built by dlwh that uses GLM as user simulator and judge to evaluate Snowball vs Qwen 3.6 35B across 2000+ simulated long-horizon chats with tool calls.

## <#1546528166086967306> — Speculative Decoding (MTP)

Atula Tejaswi [trained two 280M-param DSpark drafters](https://discord.com/channels/1354881461060243556/1546528166086967306/1560862879098339439) for the Snowball model (Grug-67B-A2B-Datakit-SFT). The best drafter ("itw", trained on the Datakit SFT mix's own replies for 80.8K steps) achieved an acceptance length of 3.141 and 2.16x tokens/s vs plain decoding, measured on 256 RL prompts at concurrency 16.

## <#1354881461060243561> — Community & Events

Percy Liang [announced a community meeting talk](https://discord.com/channels/1354881461060243556/1354881461060243561/1559296436053483641) by rohithck on *hinted scaling laws* — a method to forecast downstream task accuracy from smaller models that score 0. Slides and recording were [shared afterward](https://discord.com/channels/1354881461060243556/1354881461060243561/1559808979193045062). dlwh published a blog post on [the missing posttraining data commons](https://discord.com/channels/1354881461060243556/1354881461060243561/1560320148005462047) and [announced an NYC gathering on 10/27](https://discord.com/channels/1354881461060243556/1354881461060243561/1560748147775643821) with willheld presenting on scaling Marin. 37 new members joined the server this week.

## <#1368297424086499359> — Data Curation

marianna13 [flagged false-positive issues in RL datasets](https://discord.com/channels/1354881461060243556/1368297424086499359/1559922111630544968) (e.g. RST/RTS), where verifier-instruction misalignment causes valid solutions to fail. Mark shared [~750 science tasks](https://discord.com/channels/1354881461060243556/1368297424086499359/1559967972271849502) across Math/Statistics, Physics/Astronomy, Chemistry, and Biological Sciences generated using Taskforge, with an applet showing the build process by capability.

## <#1380235124011958313> — Long Context

Benjamin Feuer [proposed cooling down an intermediate Mochi checkpoint](https://discord.com/channels/1354881461060243556/1380235124011958313/1560395117599268905) without stopping the hero run, noting that Alex Dimakis and lukedhlee have considerable compute available to help facilitate this.

## <#1550024637927268392> — Mech Interp

Joey (PhD student from Berkeley's Learning Mechanics group) [asked whether Marin's open access](https://discord.com/channels/1354881461060243556/1550024637927268392/1560933273763446795) to model weights, training corpus, and infra has enabled novel mechanistic interpretability findings, noting the unique opportunity to study representation changes over time in a large model with known training data.

## News & Research

- willheld shared Kaiyue-Wen's work on batch size scaling: [arxiv paper](https://arxiv.org/abs/2610.08975) ([message](https://discord.com/channels/1354881461060243556/1356487690559684638/1560001280209068033))
- Kaiyue-Wen posted Microsoft's [Frontier Pre-Training blog post](https://microsoft.ai/news/frontier-pre-training-at-microsoft-ai/)
- Ahmed M Ahmed shared [Meta's Muse Spark open release](https://discord.com/channels/1354881461060243556/1356487690559684638/1560441506379341864)
- rohithck shared references on test-time scaling: [LLM Monkeys](https://arxiv.org/abs/2407.21787), [Joint Scaling Law for pass@k](https://arxiv.org/abs/2512.08894), [Scaling Law for pass@k](https://arxiv.org/abs/2509.24012)
- Kaiyue-Wen flagged [CPLM paper](https://arxiv.org/abs/2610.19247v1) with surprising gains
