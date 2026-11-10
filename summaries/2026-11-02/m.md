## <#1540486417078296576> — Hero Run & Mochi Pretraining Milestone

Marin's Mochi 535B-A23B model **finished its main pretraining phase** at 18T tokens, as [announced by dlwh](https://discord.com/channels/1354881461060243556/1354881461060243561/1567991450451320902). The hero run was relaunched from 16k to 65k context length with adjusted qk_mult (1.48→1.66) and expert-parallel capacity factor (1.15→1.5), expecting ~15% throughput loss ([PR #10820](https://github.com/marin-community/marin/pull/10820)). Over the weekend, the team is extending to **262k context** with a 4x data-mix skew toward documents >65k, [testing two attention-scaling approaches](https://discord.com/channels/1354881461060243556/1540486417078296576/1568424548179640331): a fixed YaRN-derived scale of 1.84 and an alternative method, each training for ~150B tokens. Larry proposed [saving 10 checkpoints over the last 5k steps](https://discord.com/channels/1354881461060243556/1540486417078296576/1567259650011828237) for checkpoint averaging experiments. A student reported their [professor discussed the hero run in lecture](https://discord.com/channels/1354881461060243556/1540486417078296576/1567982548737327105).

## <#1355318637854199848> — SFT Mix & Chat Templates

Benjamin Feuer shared [analysis on base model hallucinated user turns](https://discord.com/channels/1354881461060243556/1355318637854199848/1567598734957748346), finding models adopt the original user's register (73% lowercase after casual prompts). dlwh asked whether to increase chat template representation in LCE based on these findings, and [kicked off a rapid SFT run](https://discord.com/channels/1354881461060243556/1355318637854199848/1567998494676095100) using the procedure from [marin-logbooks#2](https://github.com/marin-community/marin-logbooks/issues/2) (skipping averaging). willheld pointed to the [Grug-67B SFT datakit](https://huggingface.co/open-athena/Grug-67B-A2B-Datakit-SFT-262K-2026.10.05) as the current mix and emphasized resetting/increasing LR on chat template tokens. karansag noted that [plain or rejection-sampled SFT worked best](https://discord.com/channels/1354881461060243556/1355318637854199848/1568039725275545622) for agentic tasks, with no fancy method moving the needle significantly. marianna13 shared an agentic SFT shootout on Snowball v0.

## <#1555304855822794882> — Marin for Science

Tim O'Donnell announced the **first weekly Marin for Science project meeting** for Nov 10 at 11:30am ET, [focusing on benchmarking and RL task generation](https://discord.com/channels/1354881461060243556/1555304855822794882/1568021176201257093). Allen joined to help expand terminal-bench-science into a larger RL task set (~200 tasks for the lite set, ~100 main), and proposed a [pipeline for generating easier task variants](https://discord.com/channels/1354881461060243556/1555304855822794882/1568022476208738399) that require the same skills without leaking test knowledge. Tim O'Donnell emphasized TB-Science is treated as [out-of-distribution](https://discord.com/channels/1354881461060243556/1555304855822794882/1568024593183019089) and RL training data must not be based on knowledge of it. Steven Dillmann noted many lite tasks may still be too difficult for current models.

## <#1516150256499163166> — MarinFold Progress

Tim O'Donnell posted [detailed weekly MarinFold updates](https://discord.com/channels/1354881461060243556/1516150256499163166/1566905523830394971). Key findings: **ProteinMPNN-only training** increased rollout diversity but lowered accuracy significantly (F1 0.463 vs 0.561 default, [#373](https://github.com/Open-Athena/MarinFold/issues/373)). The **smaller-model sweep** showed loss improving with size (3.248/3.083/3.018 for 255M/498M/985M vs 2.984 for 1.47B, [#362](https://github.com/Open-Athena/MarinFold/issues/362)). Both **5.86B runs diverged** despite LR reduction ([#363](https://github.com/Open-Athena/MarinFold/issues/363)). NLP-pretrained 4B Qwen models are improving, reaching eval-val R-precision 0.272 after 9B tokens ([#347](https://github.com/Open-Athena/MarinFold/issues/347)). Proofreader weighting gave a small R-precision gain (0.545→0.550) but guided search didn't help. Supplying 8 random true contacts improved remaining-contact R-precision by ~6 points.

## <#1368297424086499359> — Data Curation & Quality

Min Li [audited the Open-SWE portion](https://discord.com/channels/1354881461060243556/1368297424086499359/1567051636592082994) of the 10-05 SFT mix (49,925 successful traces), finding data leaks through site-packages containing fixes (~0.1-0.3% of traces). Benjamin Feuer tracked this in [#10865](https://github.com/marin-community/marin/issues/10865). Yoav Artzi asked about access to the Marin pretraining corpus for scaling estimates; dlwh explained they [can't rehost data but are working on a metadata-only version](https://discord.com/channels/1354881461060243556/1368297424086499359/1567352094606762058) for faster materialization. Charlie R flagged [TMax v1.1](https://wai-org.com/blog/tmax-v1-1/) as an updated data source.

## <#1374989195109466122> — Reinforcement Learning

jjmachan shared a paper club on [RL data mixtures](https://luma.com/1j0drr5m). Bilibird discussed cost estimation for unified training and whether tasks need laddering as model capability progresses. Bilibird also shared [Nemotron post-RL analysis](https://surgehq.ai/blog/nvidia-nemotron-3-5-super-training-report). Atula Tejaswi asked about Snowball's RLVR training trajectories. Alessandro Palmas shared a Grug RLVR run.

## <#1366632114316906506> — Agent Tooling & Multi-Agent Collaboration

Benjamin Feuer proposed using [Rhizome](https://tryrhizome.dev/) (by Nico B and Andreea Georgescu) as a secure shared-state layer for agents on the cluster. willheld clarified that ["Buzz" refers to karansag's homegrown swarm IDE](https://discord.com/channels/1354881461060243556/1366632114316906506/1567231417790759022), not the Block product. Nico B submitted a [PR to Buzz](https://github.com/karansag/buzz/pull/24) for configurable agent harnesses and [proposed Rhizome as the session connectivity layer](https://discord.com/channels/1354881461060243556/1366632114316906506/1567678101562069104), using native agent messaging platforms rather than TTY.

## <#1527756652890161292> — Architecture & Scaling Heuristics

cole asked about multi-stream attention residuals; Larry reported [no meaningful gain beyond simple conv](https://discord.com/channels/1354881461060243556/1527756652890161292/1566854227559719003) at small scale. Larry shared [detailed architecture tuning heuristics](https://discord.com/channels/1354881461060243556/1527756652890161292/1568046159744860341) for adapting the MoE recipe to AMD hardware: ~60 optimal tokens per active parameter, layer count = hidden_dim/90-128, layer count divisible by 4 for local/global ratio, num_heads divisible by 4-8 for GQA. dlwh added that num_kv_heads should also be divisible by 4 for inference.

## Community Growth & Introductions

48 new members joined via <#1375164400239120504>. Notable introductions in <#1357057383830126652>: AlexIsEpic (Harvard, optimization/pretraining), Robert (Caltech, ai4math/formal verification), chris mcconnell (new Open Athena team member focusing on evals, ex-Meta Llama), Cheryl (Elasticity Institute/GovAI, measuring RSI), jsdenain (METR, AI R&D acceleration), aryonkct (Rice, hyperparameter tuning), and arsalan-zafar (ex-Deep Render, agentic LLMs). Percy Liang noted ongoing projects in <#1562208513021976738> on fundamental limits of small models. ansh suggested [IFM's advisor pipeline](https://github.com/ifm-ai/advisor) for environment synthesis.

## News & Research

- Larry shared the [Mistral Large 4 technical report](https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B/blob/main/assets/technical_report.pdf), noting their KV-cache reduction hurt agentic tasks and was fixed via model surgery to DeepSeek Sparse Attention ([message](https://discord.com/channels/1354881461060243556/1356487690559684638/1567085534231400520))
- dlwh flagged [Inkling 2 Small](https://thinkingmachines.ai/news/inkling-2-small/) for discussion
- Robert shared the [Beam technical report](https://reflection.ai/documents/beam-model-tech-report)
- wumpus shared a [Common Crawl quality analysis paper](https://arxiv.org/abs/2610.13321) showing significant low-hanging fruit in content quality vs CCBot crawl budgets
- Bilibird shared a paper on [model choices for reasoning data generation](https://arxiv.org/pdf/2610.19425) in <#1484315476325826660>
- Michal shared research on [data shuffling effects on training loss](https://bgerofi.github.io/papers/tnguyen-IPDPS22.pdf) in <#1462895580064911522>
