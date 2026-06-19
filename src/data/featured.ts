export interface FeaturedResearch {
  title: string;
  venue: string;
  year: number;
  description: string;
  link?: string;
}

export interface FeaturedProject {
  title: string;
  description: string;
  tags: string[];
  link?: string;
}

export const featuredResearch: FeaturedResearch[] = [
  {
    title: "Deep Residual Learning for Image Recognition",
    venue: "CVPR 2016 / arXiv:1512.03385",
    year: 2015,
    description: "Proposed residual learning framework that enables training of substantially deeper networks by reformulating layers as learning residual functions with reference to layer inputs.",
    link: "https://arxiv.org/abs/1512.03385",
  },
  {
    title: "NeoVerse: Enhancing 4D World Model with in-the-wild Monocular Videos",
    venue: "Preprint",
    year: 2025,
    description: "A novel framework that leverages diverse monocular video data to improve 4D world model generalization across complex dynamic scenes.",
    link: "https://arxiv.org/abs/2506.04132",
  },
  {
    title: "MegaSaM: Accurate, Fast and Robust Structure and Motion from Casual Dynamic Videos",
    venue: "Preprint / arXiv",
    year: 2024,
    description: "A robust system for recovering accurate camera parameters and dense scene structure from casually captured dynamic videos with fast inference speed.",
    link: "https://arxiv.org/abs/2412.04463",
  },
];

export const featuredProjects: FeaturedProject[] = [
  {
    title: "Project Name",
    description: "A short description of what this project does.",
    tags: ["Python", "PyTorch"],
  },
  {
    title: "Another Project",
    description: "What this project is about in one line.",
    tags: ["Python", "Transformers"],
  },
];
