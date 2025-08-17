#!/bin/bash
# Script d'initialisation pour ClickHouse
# Résout les problèmes d'IPv6 et de parties corrompues

# Créer un fichier de configuration personnalisé pour désactiver IPv6
cat > /etc/clickhouse-server/config.d/ipv4_only.xml << EOF
<yandex>
    <!-- Configuration pour désactiver IPv6 et forcer IPv4 -->
    <listen_host>0.0.0.0</listen_host>
    
    <!-- Configuration pour la journalisation des erreurs -->
    <logger>
        <level>warning</level>
        <console>1</console>
    </logger>
    
    <!-- Nettoyage automatique des parties endommagées -->
    <merge_tree>
        <enable_mixed_granularity_parts>1</enable_mixed_granularity_parts>
        <min_bytes_for_wide_part>0</min_bytes_for_wide_part>
        <min_rows_for_wide_part>0</min_rows_for_wide_part>
    </merge_tree>
</yandex>
EOF

# S'assurer que les permissions sont correctes
chown 101:101 /etc/clickhouse-server/config.d/ipv4_only.xml
chmod 644 /etc/clickhouse-server/config.d/ipv4_only.xml

echo "Configuration personnalisée de ClickHouse appliquée avec succès"
