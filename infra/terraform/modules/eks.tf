# ─────────────────────────────────────────────────────────────────────────────
# EKS – Managed Kubernetes cluster with node groups per the production plan
# ─────────────────────────────────────────────────────────────────────────────
variable "kubernetes_version" { default = "1.30" }

resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  version  = var.kubernetes_version
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

# ── IAM ──────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "eks_cluster" {
  name               = "${var.cluster_name}-eks-cluster"
  assume_role_policy = data.aws_iam_policy_document.eks_assume.json
}

data "aws_iam_policy_document" "eks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "node_group" {
  name               = "${var.cluster_name}-node-group"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "worker_node_policy" {
  role       = aws_iam_role.node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "cni_policy" {
  role       = aws_iam_role.node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "ecr_read_policy" {
  role       = aws_iam_role.node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# ── Node Groups ───────────────────────────────────────────────────────────────
resource "aws_eks_node_group" "redirect_hot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "redirect-hot"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["c7g.2xlarge"]

  scaling_config {
    desired_size = 3
    min_size     = 3
    max_size     = 20
  }

  labels = { workload = "redirect-hot" }
  taint {
    key    = "workload"
    value  = "redirect-hot"
    effect = "NO_SCHEDULE"
  }
}

resource "aws_eks_node_group" "api_general" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "api-general"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["m7i.xlarge"]

  scaling_config {
    desired_size = 3
    min_size     = 3
    max_size     = 10
  }

  labels = { workload = "api-general" }
}

resource "aws_eks_node_group" "data_workers" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "data-workers"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["r7i.2xlarge"]

  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 6
  }

  labels = { workload = "data-workers" }
}

resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["t3.medium"]

  scaling_config {
    desired_size = 3
    min_size     = 3
    max_size     = 3
  }

  labels = { workload = "system" }
}

output "cluster_endpoint"                { value = aws_eks_cluster.main.endpoint }
output "cluster_certificate_authority"   { value = aws_eks_cluster.main.certificate_authority[0].data }
output "cluster_name"                    { value = aws_eks_cluster.main.name }
