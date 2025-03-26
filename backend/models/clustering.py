from sklearn.mixture import GaussianMixture
import numpy as np

def cluster_embeddings(embeddings_file, output_file, n_clusters=20):
    embeddings = np.load(embeddings_file)
    gmm = GaussianMixture(n_components=n_clusters, covariance_type='full', random_state=42)
    gmm.fit(embeddings)
    cluster_labels = gmm.predict(embeddings)
    np.save(output_file, cluster_labels)
    return cluster_labels

if __name__ == "__main__":
    cluster_labels = cluster_embeddings("../data/embeddings.npy", "../data/cluster_labels.npy")
    print(f"Clustered into {len(set(cluster_labels))} clusters.")