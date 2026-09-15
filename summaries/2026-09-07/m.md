## <#1374989195109466122> — Reinforcement Learning

lukedhlee posted a [detailed W1 report](https://discord.com/channels/1354881461060243556/1374989195109466122/1546613497779982507) on RL with Snowball on r2egym: 20–30 RL steps doubled pass@1 from 8.7% to 16.6%, though gains came primarily from ending turns earlier rather than better debugging. He identified critical bugs including broken KL and incorrect loss computation scope. A [TITO token mismatch issue](https://discord.com/channels/1354881461060243556/1374989195109466122/1546788165954568223) affected 40/64 sampled trajectories, flagged after Charlie's [blog post](https://www.mercor.com/blog/training-frontier-knowledge-work-agents-a-397b-rl-training-guide-with-skyrl/).

lukedhlee ran an [ablation on re-feeding reasoning history](https://discord.com/channels/1354881461060243556/1374989195109466122/1547120190758584320) to manage context overflow — since 90%+ of pre-RL trajectories died from context overflow and 30%+ of input tokens came from reasoning traces, he tested 5 variants of history management on 160+ r2egym tasks.

A major win: lukedhlee shipped [speculative decoding with EAGLE-3](https://discord.com/channels/1354881461060243556/1374989195109466122/1548067373070946324) for Snowball RL rollouts — the adapted draft model achieves **61% faster decoding** with no need to update the draft model during RL (tested through 36 steps). Training cost: ~25 GPU-hours for rollout generation + 25 min for the drafter. Russell Power [suggested](https://discord.com/channels/1354881461060243556/1374989195109466122/1547711183757250700) making draft tuning automatic by SFT-ing on rollouts as they happen.

lukedhlee also posted a [comprehensive RL stack update](https://discord.com/channels/1354881461060243556/1374989195109466122/1547869508939554898) documenting infra fixes migrated from forks to Marin repos, including [harbor #126](https://github.com/marin-community/harbor/pull/126).

Benjamin Feuer shared [early agentic RL curves](https://discord.com/channels/1354881461060243556/1374989195109466122/1546476043081224193) on Qwen3 Coder Instruct with BugsInPy from TaskTrove (GH issue [#8942](https://github.com/marin-community/marin/issues/8942)), and published a [reconstruction of Nemotron 3 Ultra's post-training pipeline](https://discord.com/channels/1354881461060243556/1374989195109466122/1548006880071122994), noting no one has released a complete reproducible post-training pipeline for an agentic MoE.

dlwh [floated the idea](https://discord.com/channels/1354881461060243556/1374989195109466122/1547319978729017435) of compacting SFT thinking traces to improve token efficiency. Neha Hulkund proposed building an [SFT capabilities ladder](https://discord.com/channels/1354881461060243556/1374989195109466122/1548066871792762965) to determine which SFT base + RL stack produces the best final model. marianna13 [noted](https://discord.com/channels/1354881461060243556/1374989195109466122/1548243073119551592) that too much SFT can destroy exploration capabilities for RL.

## <#1418673157585502370> — DNA Foundation Models

Jean du Terrail [introduced himself](https://discord.com/channels/1354881461060243556/1418673157585502370/1546914168312041525) as a French researcher in plant genomics and shared the BOTANIC-1 paper — a series of long-context plant genomic language models. Eric Czech [welcomed him](https://discord.com/channels/1354881461060243556/1418673157585502370/1547326051926016170) and shared [Marin + PlantCAD2 slides](https://github.com/eric-czech/marin-dna-slides-20260810/blob/main/slides.pdf) on preliminary MarinDNA plant model work, currently blocked on better VEP evals.

A rich discussion ensued on CLM vs MLM tradeoffs for genomics. Eric Czech [argued](https://discord.com/channels/1354881461060243556/1418673157585502370/1547995534273286297) the choice is less about performance and more about constraints, drawing parallels to BERT vs GPT in NLP. Jean du Terrail [highlighted](https://discord.com/channels/1354881461060243556/1418673157585502370/1548030836392198225) key open questions: how to show true scaling laws in DNA (most tasks lack species coverage) and what "post-training" means for DNA models. Furkan [mentioned](https://discord.com/channels/1354881461060243556/1418673157585502370/1548024439122169967) the Ettin paper as a reference for CLM/MLM comparison and asked about Muon optimizer usage.

Jean confirmed Evo2 scores use RC-complement averaging + center pooling, and that the VEP benchmark will be shared with Marin soon.

## <#1546528166086967306> — Multi-Token Prediction & Snowball Provenance

Benjamin Feuer created the new #mtp channel for MTP discussions, pointing Atula Tejaswi and Sujay to key resources including [mumwelt](https://github.com/Open-Athena/mumwelt) and Snowball pretraining issues ([#6044](https://github.com/marin-community/marin/issues/6044), [#8225](https://github.com/marin-community/marin/issues/8225)). Jeff H noted that Larry had done [exploratory MTP work](https://github.com/marin-community/marin/issues/5772).

Benjamin Feuer [reverse-engineered](https://discord.com/channels/1354881461060243556/1546528166086967306/1546553221240197243) Snowball's pretraining data provenance from datamix swarms and published a [token-to-token provenance dataset](https://huggingface.co/datasets/open-athena/snowball-replay/tree/main) on HuggingFace. lukedhlee cross-posted his speculative decoding results here, noting it's [RL-ready](https://discord.com/channels/1354881461060243556/1546528166086967306/1548069579778035712) and complementary to MTP.

## <#1516150256499163166> — MarinFold

Tim O'Donnell posted a [comprehensive weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1547253269817073694). Key highlights:
- **Data expansion**: Using ProteinMPNN to generate new sequences for existing structures, reaching 232M documents / 248B tokens (3.3× increase). See [#266](https://github.com/Open-Athena/MarinFold/issues/266), [#267](https://github.com/Open-Athena/MarinFold/issues/267).
- **Token smearing** (removing RoPE for set-based conditioning) looked promising at small scale but didn't help in full training ([#262](https://github.com/Open-Athena/MarinFold/issues/262), [#272](https://github.com/Open-Athena/MarinFold/issues/272)).
- **Better contacts → better structures**: contact precision improved 0.510→0.542, lDDT 0.605→0.630 on eval-val.
- **Default model switched** to decontaminated checkpoint (`contacts-v1-exp232-m2-p06-train-1.5B`, R-precision 0.6051).
- Upcoming: Proteina for structural diversity, SFT-based post-training (iterated dataset generation), and training on the 248B token set ([#274](https://github.com/Open-Athena/MarinFold/issues/274)).

A short progress update was submitted to [MoML](https://jclinic.mit.edu/events/moml-mit-2026/) at MIT (results not public yet).

## <#1540486417078296576> — Hero Run 2026

mcwitt [deployed](https://discord.com/channels/1354881461060243556/1540486417078296576/1547328590402814064) the ragged expert-parallel backend for the hero run, rewinding 200 steps to 81716 for validation. markhart0034 [flagged](https://discord.com/channels/1354881461060243556/1540486417078296576/1546615008706830388) potentially suspicious train/eval loss behavior since the restart.

Sheng Zha [shared](https://discord.com/channels/1354881461060243556/1540486417078296576/1547764290931400715) detailed MoE router stability tips: unit-norm reparameterization, noise injection/sampling instead of hard top-k, and bias centering — techniques that enabled stable trillion-parameter training. Larry [responded](https://discord.com/channels/1354881461060243556/1540486417078296576/1547824756043153450) that they use sigmoid routing without z-loss and now have a near-dropless ragged all-to-all implementation.

## <#1484315476325826660> — OpenThoughts Next

Benjamin Feuer [announced](https://discord.com/channels/1354881461060243556/1484315476325826660/1547227211168227348) he's stepping back from leading OT-Next weekly meetings, handing RL leadership to marianna13 and SFT/data curation to Neha Hulkund.

Neha Hulkund [kicked off](https://discord.com/channels/1354881461060243556/1484315476325826660/1547290012708634686) discussion on reference models and success metrics for the effort. Franziska Weindel [reported](https://discord.com/channels/1354881461060243556/1484315476325826660/1547671961851662346) that the data breakout selected 4 primary data sources for TaskTrove integration: agent skill files (from [Terminal-World](https://arxiv.org/abs/2605.20876), [SkillSynth](https://arxiv.org/abs/2604.25727), [SKILL0](https://arxiv.org/abs/2604.02268)), taxonomy-driven web search, hard-negative mining, and execution-mined tasks. Bilibird [noted](https://discord.com/channels/1354881461060243556/1484315476325826660/1547826607782371390) that DeepSeek 4.1-Flash's report reveals a post-training recipe heavily focused on data synthesis with (problem, environment, verification system) triplets.

## <#1368297424086499359> — Data Curation

likelytobelaura [proposed](https://discord.com/channels/1354881461060243556/1368297424086499359/1547004047100223608) adding SQL engineering datasets to TaskTrove. unit [suggested](https://discord.com/channels/1354881461060243556/1368297424086499359/1547218837404131359) Kaggle-style tasks from OpenML for modeling/data analysis coverage. Mark [shared a pipeline doc](https://discord.com/channels/1354881461060243556/1368297424086499359/1547373328728334377) for synthetic task generation with GLM 5.3.

dlwh [attempted](https://discord.com/channels/1354881461060243556/1368297424086499359/1547351755539357706) exact dedup on TaskTrove but was blocked by HF rate limits. willheld [published](https://discord.com/channels/1354881461060243556/1368297424086499359/1548432746655785040) a 10k-conversation compaction dataset from GLM 5.3 using AgentTrove traces: <https://huggingface.co/datasets/open-athena/agenttrove-glm53-compactions>.

## <#1365058937589858324> — Code Review

mcwitt [fixed](https://discord.com/channels/1354881461060243556/1365058937589858324/1546945120195051700) an NCCL window registration conflict caused by inconsistent inferred sharding between first and subsequent `train_step` compilations ([PR link](https://github.com/marin-community/marin/pull/8978)). willheld [added chat normalization](https://discord.com/channels/1354881461060243556/1365058937589858324/1547342700943118356) using the OpenAI Harmony format as an intermediate representation for SFT data. dlwh [added PR review guidance](https://discord.com/channels/1354881461060243556/1365058937589858324/1548056810592800919) ([#9111](https://github.com/marin-community/marin/pull/9111)) to address external PRs languishing without reviewers.

## <#1356487738840318002> — Evals

lukedhlee [raised](https://discord.com/channels/1354881461060243556/1356487738840318002/1547681351849869486) the question of eval protocol versioning after fixing TITO support in Harbor ([#122](https://github.com/marin-community/harbor/pull/122)). Mrinal Kumar [proposed](https://discord.com/channels/1354881461060243556/1356487738840318002/1547710721259868220) a dual-lane eval policy: one pinned for cross-model comparability and one aligned with the current training stack for checkpoint selection.

## News & Research

- [DeepSeek V4.1-Flash tech report](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf) shared by Kaiyue-Wen
- dlwh shared [MILES](https://arxiv.org/abs/2609.08368) (a Slime fork) and [ZeroEntropy embeddings](https://zeroentropy.dev/embeddings/) — asked how it compares to Harrier
- Percy Liang shared a [tweet from Sadhika Malladi](https://x.com/SadhikaMalladi/status/2098485659543728479)
- Kaiyue-Wen had a "Schmidhuber moment" referencing [issue #8196](https://github.com/marin-community/marin/issues/8196)
- ~95 new members joined via #welcome-room; notable new introductions include a Cambridge stats professor asking about math foundation models, researchers from LBNL, Microsoft, UChicago, and BethgeLab
