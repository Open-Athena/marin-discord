## <#1365044508546568372> — MoE Training Gains Compound

The MoE workstream hit several milestones this week. willheld confirmed that linear decay schedule outperforms WSD with cooldown, yielding a [0.03 BPB improvement](https://marin-discord.pages.dev/#1365044508546568372/1485898126454820907) (1.047→1.016) at 3e18 flops. Kaiyue-Wen noted the AdamH refinement algorithm converges to near-linear anyway, so the team is sticking with linear.

Larry credited Pranshu Chaturvedi and willheld for QB load balancing that works across scales with [zero hyperparameters and 10-15% speedup](https://marin-discord.pages.dev/#1365044508546568372/1487197835580412055). Capacity fraction experiments showed surprisingly that even 0.8x barely hurts loss — dlwh joked it's basically dropout. Larry kicked off 1e20 experiments at [1.25, 1.1, 1.0] to nail this down before committing at scale.

The big launch: Larry started the [1e22 run (35B/A5B, 326B tokens)](https://marin-discord.pages.dev/#1365044508546568372/1487693945944412170) on v4-512, expected to complete in a week. Early results are [tracking close behind the 1e23 Delphi dense run](https://marin-discord.pages.dev/#1365044508546568372/1487889648859480217). See [marin-community/marin#3800](https://github.com/marin-community/marin/issues/3800) for details.

## <#1364827114670657616> — Iris Restarts and Cluster Fires

A rough week for infrastructure. Russell Power performed [four Iris controller restarts](https://marin-discord.pages.dev/#1364827114670657616/1486401206640443452) — the first on Tuesday caused DB state loss requiring manual recovery, with Ahmed needing to [restart RL jobs](https://marin-discord.pages.dev/#1364827114670657616/1486410026729078814). Subsequent restarts on Wednesday, Thursday, and Friday went smoother, bringing performance improvements and bug fixes.

us-central1 went down mid-week, with Michael Ryan [restarting the cluster](https://marin-discord.pages.dev/#1364827114670657616/1486525469619654828). us-east5a saw heavy [preemption](https://marin-discord.pages.dev/#1364827114670657616/1486939934299394070) — "The TPU gods giveth and the TPU gods taketh away" (dlwh).

Ahmed hit a [nested job path length bug](https://marin-discord.pages.dev/#1364827114670657616/1486145415169446141) in `/dev/shm` with deeply nested Iris RL jobs. Russell noted hashing the path would fix it. rohithck hit [circular import issues](https://marin-discord.pages.dev/#1364827114670657616/1486846287310487674) with `iris.rpc` pb2 files after rebasing — a known `.gitignore` issue Russell plans to resolve.

Notable adoption moment: rohithck tried the [`/babysit-job` Claude Code skill](https://marin-discord.pages.dev/#1364827114670657616/1487139579084673227) and was immediately impressed by its TPU failure detection — "I am feeling the agi."

willheld got [activation logging working](https://marin-discord.pages.dev/#1364827114670657616/1485833397560672396) via `jax.debug.callback` with ~4% MFU overhead on active steps, and discovered Vizier/Optuna can accept [prior hyperparameter sets](https://marin-discord.pages.dev/#1364827114670657616/1485911281146925087).

## <#1368297424086499359> — Synthetic Data Strategy Takes Shape

Benjamin Feuer shared the [OpenThoughts-3 dataset](https://huggingface.co/datasets/laion/openthoughts3-1.2m-glm4.7-20k) (GLM 4.7 teacher, 20k context). willheld posted the [algorithmic synthetic data issue](https://github.com/marin-community/marin/issues/4148#issuecomment-4138068961) for step-by-step arithmetic, regex, and bash command data.

A substantive debate followed on CPU-only generation vs. LM-based distillation. willheld argued for CPU-only: generating ~1T tokens from GPT-OSS would [cost ~$500k in compute](https://marin-discord.pages.dev/#1368297424086499359/1486983651047768145), while [~50k idle CPUs](https://marin-discord.pages.dev/#1368297424086499359/1486985213639917640) sit unused on training nodes. The open question is how many tokens of deterministic data are useful before overfitting the template format.

willheld also surfaced a [Chinese FineWeb-Edu dataset](https://huggingface.co/datasets/opencsg/Fineweb-Edu-Chinese-V2.1) needing Chinese-speaker spot-checking, and noted concerns about unknown datasets ([poisoning risk](https://marin-discord.pages.dev/#1368297424086499359/1487217376335233042)) motivating in-house generation. nato pointed to existing arithmetic data in recent Dolma midtraining datasets.

## <#1366632114316906506> — Hashing Strategy Reckoning

rohithck reported a [nemotron glob change breaking paths](https://github.com/marin-community/marin/issues/4204) due to hash instability. This sparked a broader discussion on the experiment hashing strategy. willheld is converging toward [only hashing external state](https://marin-discord.pages.dev/#1366632114316906506/1487153518526857327) not captured by the git commit, while Russell noted hashes are [too aggressive](https://marin-discord.pages.dev/#1366632114316906506/1487276226166132916) (e.g., versioning gz vs zstd compression format). Ahmed advocated for [more legible, explicit naming](https://marin-discord.pages.dev/#1366632114316906506/1487279610306498700) anchored on HF revision IDs. Russell pushed a [fix for the immediate issue](https://github.com/marin-community/marin/pull/4219).

## <#1356490712199462912> — Chinchilla Paper Published, Loss Forecasting WIP

Eric Czech published the [Chinchilla replication preprint](https://arxiv.org/abs/2603.22339) with a [project site](https://openathena.ai/scaling-law-analysis) including HF dataset and Claude demo. Kaiyue-Wen provided a [detailed breakdown](https://marin-discord.pages.dev/#1356490712199462912/1486553066202464336) of batch size scaling theory (α between 0.5 and 0.67), concluding the practical difference is negligible.

willheld demoed [early-loss → final-loss prediction](https://marin-discord.pages.dev/#1356490712199462912/1487571716833022084) for linear decay runs. Single early loss point plus model size and token volume gives good forecasts — useful for de-risking large MoE runs. Percy Liang suggested extending to [model Loss(N, D) across different ratios](https://marin-discord.pages.dev/#1356490712199462912/1487295457066619060).

## <#1374989195109466122> — RL Stabilizes, LoRA Looking Promising

Ahmed confirmed [Ray was the root cause](https://marin-discord.pages.dev/#1374989195109466122/1486914443060449320) of long-running RL crashes ([marin-community/marin#2385](https://github.com/marin-community/marin/issues/2385)). Switching to on-demand v5p-8 workers without Ray got 500 stable steps across multiple runs. Next: reproducing on Iris to close the issue.

Ahmed also got [LoRA DPO and pipeline-parallel vLLM working with Qwen 225B](https://marin-discord.pages.dev/#1374989195109466122/1486934734738030652). The Cursor RL paper's weight-sync-over-S3 approach (exploiting sparse RL updates) makes him [more bullish on LoRA for RL](https://marin-discord.pages.dev/#1374989195109466122/1486197875925848225).

## <#1462895580064911522> — Data Mixing Variance Reduction

yurusankyo found that [scaling to 300M models didn't reduce variance](https://marin-discord.pages.dev/#1462895580064911522/1485826775782264863); the 60M/1.2B swarm config remains most compute-efficient for reaching target SEM. Now running fixed-subset, 3-seeds-per-mixture swarms to separate mixture surface from seed effects.

Critical catch from David Heineman (AI2): the mixing experiments should use [`mmlu_sl_verb` instead of standard MMLU](https://marin-discord.pages.dev/#1462895580064911522/1486487634044911787) (logprobs over letters is much noisier). yurusankyo confirmed this [significantly reduced noise](https://marin-discord.pages.dev/#1462895580064911522/1486640925328408669).

## <#1375005693899309126> — Delphi 1e23 Loss Forecasting

willheld shared [high-confidence forecasts](https://marin-discord.pages.dev/#1375005693899309126/1487556665875107870) for 1e23 Delphi final loss based on cooldown trends. The fixed-asymptote forecast was pessimistic, learned-asymptote was optimistic, and current estimate splits the difference. Team preference is for pessimistic (fixed asymptote) forecasts even if slightly less accurate.

## <#1365058937589858324> — Code Reviews & PRs

Ahmed fixed [stale refresh + nested job visualization](https://github.com/marin-community/marin/pull/4108) in Iris dashboard and [tokenizer stop IDs](https://github.com/marin-community/marin/pull/4154) for SFT/DPO. Russell merged [Iris restart fixes](https://github.com/marin-community/marin/pull/4199) and [truth-in-advertising adjustments](https://github.com/marin-community/marin/pull/4178). Ahmed also proposed a [Claude Code commit skill](https://github.com/marin-community/marin/pull/4254) for the team.

## Security & Supply Chain

Ahmed raised [supply-chain security concerns](https://marin-discord.pages.dev/#1364827114670657616/1487271472027275415) after the litellm compromise, proposing lockfile protections in `pyproject.toml` — especially relevant with agents installing packages on cluster branches.

## News & Research

- [Chinchilla replication preprint](https://arxiv.org/abs/2603.22339) — Eric Czech et al.
- [Cursor Composer 2 paper](https://cursor.com/resources/Composer2.pdf) — "Good day to be perplexity pilled" (willheld)
- [Critical batch size scaling](https://arxiv.org/abs/2603.21191) — theoretical basis for token_budget^(2/3)
- [MoE scaling laws paper](https://arxiv.org/pdf/2603.21862) — limited by fixed (Ne=288, K=8) config
- [Fireworks RL weight sync](https://fireworks.ai/blog/frontier-rl-is-cheaper-than-you-think#the-1-tb-problem) — exploiting sparse RL updates for S3-based sync
- [CAMEL data mixing paper](https://arxiv.org/abs/2603.08022v1) — hourglass sampling + val loss → benchmark connection
- [SWE-rebench](https://marin-discord.pages.dev/#1435065934992773221/1486043417212616704) — 50k Docker envs from Nebius, instructions incoming

## Community

14 new members joined via #welcome-room. Notable introductions: Alexander Kurz (logic/category theory for formal proofs), Korbinian (ELLIS Tübingen, xLSTM), Alex Dimakis (UC Berkeley / Bespoke Labs, OpenThoughts, RL environments).
