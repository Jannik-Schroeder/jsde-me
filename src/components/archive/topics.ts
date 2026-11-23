const slugsByTopic = {
  Networking: [
    'dual-stack-deployment-checks',
    'authoritative-dns-powerdns',
    'carp-mlag-unicast-flooding',
    'home-network-v3',
    'steam-lan-cache',
    'netbox-source-of-truth',
    'home-network-v2',
    'home-network-v1',
    'first-steps-into-new-homenetwork',
  ],
  Infrastructure: [
    'git-to-running-container-proof',
    'dual-stack-deployment-checks',
    'backups-you-actually-restore',
    'missing-data-is-not-zero-traffic',
    'homelab-alerting-ntfy',
    'seaweedfs-ha-s3',
    'selfhosting-cicd-forgejo',
    'netbox-source-of-truth',
    'docker-optimized-builds',
    'setup-k3s',
    'proxmox-ve-cloud-init',
  ],
  'Self-hosting': [
    'plexamp-hifi-endpoint',
    'stalwart-mail-dmz',
    'seaweedfs-ha-s3',
    'authentik-sso-homelab',
    'selfhosting-cicd-forgejo',
    'steam-lan-cache',
    'self-hosted-music-stack',
    'samba-ad-dfs-homelab',
    'paperless-ngx-dms',
    'setup-zigbee2mqtt',
    'setup-openhab',
    'solun-deploy',
  ],
  'Security & identity': [
    'stalwart-mail-dmz',
    'authentik-sso-homelab',
    'samba-ad-dfs-homelab',
    'pfx-certificate-to-pem',
    'solun-privacy',
  ],
  Development: [
    'scheduled-posts-nextjs-publication-tests',
    'git-to-running-container-proof',
    'selfhosting-cicd-forgejo',
    'docker-optimized-builds',
    'solun-struc',
    'solun-introduction',
  ],
}

export function getArticleTopics(slug: string) {
  return Object.entries(slugsByTopic)
    .filter(([, slugs]) => slugs.includes(slug))
    .map(([topic]) => topic)
}
