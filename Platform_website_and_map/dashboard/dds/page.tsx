"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { supabase, calculateArea, parseGeometry } from "../../../lib/supabase";

interface Parcelle {
  id: number;
  filename: string;
  area: number;
}

export default function DDSPage() {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [selectedParcelle, setSelectedParcelle] = useState("");
  const [ddsType, setDdsType] = useState("export_ue");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDDS, setGeneratedDDS] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ddsHistory, setDdsHistory] = useState<
    { id: string; parcelle: string; date: string; type: string }[]
  >([]);

  useEffect(() => {
    loadParcelles();
  }, []);

  const loadParcelles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("parcelles_geojson")
        .select("*");

      if (error) throw error;

      if (data && data.length > 0) {
        const parcellesWithArea = data.map((row, index) => {
          const geometry = parseGeometry(row.geometry);
          const area = geometry ? calculateArea(geometry.coordinates) / 10000 : 0;
          return {
            id: row.id || index + 1,
            filename: row.filename || row.name || `Parcelle ${row.id || index + 1}`,
            area: area,
          };
        });
        setParcelles(parcellesWithArea);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!selectedParcelle) return;

    setIsGenerating(true);
    // Simulation de génération
    setTimeout(() => {
      const newId = `DDS-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
      setGeneratedDDS(newId);
      setIsGenerating(false);

      // Ajouter à l'historique
      const parcelle = parcelles.find((p) => p.filename === selectedParcelle);
      if (parcelle) {
        setDdsHistory((prev) => [
          {
            id: newId,
            parcelle: parcelle.filename,
            date: new Date().toLocaleDateString("fr-FR"),
            type: ddsType === "export_ue" ? "Export UE" : ddsType === "audit_interne" ? "Audit interne" : "Certification",
          },
          ...prev,
        ]);
      }
    }, 2000);
  };

  const selectedParcelleData = parcelles.find((p) => p.filename === selectedParcelle);

  return (
    <>
      <Navigation />
      <main className="pt-16 min-h-screen bg-light-gray">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-ink-black text-off-white p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="meta-text text-congo-cyan mb-2">
                  GÉNÉRATEUR DDS
                </div>
                <h1 className="text-2xl font-bold font-sans">
                  Due Diligence Statement
                </h1>
              </div>
              <Link
                href="/connexion"
                className="px-4 py-2 border border-off-white/30 text-off-white text-sm hover:bg-off-white/10 transition-colors"
              >
                ← Tableau de bord
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulaire génération */}
            <div className="bg-white border border-tech-gray/20 p-6">
              <h3 className="font-sans font-semibold text-ink-black mb-6">
                Nouveau DDS - Parcelles réelles
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="text-congo-cyan text-2xl mb-2">⏳</div>
                  <div className="text-tech-gray">Chargement des parcelles...</div>
                </div>
              ) : (
                <>
                  {/* Sélection parcelle */}
                  <div className="mb-4">
                    <label className="block meta-text text-tech-gray mb-2">
                      Parcelle ({parcelles.length} disponibles)
                    </label>
                    <select
                      value={selectedParcelle}
                      onChange={(e) => setSelectedParcelle(e.target.value)}
                      className="w-full px-4 py-3 border border-tech-gray/30 bg-light-gray focus:outline-none focus:border-congo-cyan"
                    >
                      <option value="">Sélectionner une parcelle</option>
                      {parcelles.map((parcelle) => (
                        <option key={parcelle.id} value={parcelle.filename}>
                          {parcelle.filename} - {parcelle.area.toFixed(4)} ha
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Info parcelle sélectionnée */}
                  {selectedParcelleData && (
                    <div className="mb-4 p-4 bg-congo-cyan/10 border border-congo-cyan/20">
                      <div className="meta-text text-congo-cyan mb-2">
                        PARCELLE SÉLECTIONNÉE
                      </div>
                      <div className="text-ink-black font-medium">
                        {selectedParcelleData.filename}
                      </div>
                      <div className="text-sm text-tech-gray mt-1">
                        ID: {selectedParcelleData.id} · Surface:{" "}
                        {selectedParcelleData.area.toFixed(4)} ha (
                        {(selectedParcelleData.area * 10000).toFixed(2)} m²)
                      </div>
                    </div>
                  )}

                  {/* Type de DDS */}
                  <div className="mb-4">
                    <label className="block meta-text text-tech-gray mb-2">
                      Type de déclaration
                    </label>
                    <select
                      value={ddsType}
                      onChange={(e) => setDdsType(e.target.value)}
                      className="w-full px-4 py-3 border border-tech-gray/30 bg-light-gray focus:outline-none focus:border-congo-cyan"
                    >
                      <option value="export_ue">Export UE (EUDR)</option>
                      <option value="audit_interne">Audit interne</option>
                      <option value="certification">
                        Renouvellement certification
                      </option>
                    </select>
                  </div>

                  {/* Période */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block meta-text text-tech-gray mb-2">
                        Date début
                      </label>
                      <input
                        type="date"
                        defaultValue="2025-01-01"
                        className="w-full px-4 py-3 border border-tech-gray/30 bg-light-gray focus:outline-none focus:border-congo-cyan"
                      />
                    </div>
                    <div>
                      <label className="block meta-text text-tech-gray mb-2">
                        Date fin
                      </label>
                      <input
                        type="date"
                        defaultValue="2026-01-18"
                        className="w-full px-4 py-3 border border-tech-gray/30 bg-light-gray focus:outline-none focus:border-congo-cyan"
                      />
                    </div>
                  </div>

                  {/* Bouton générer */}
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedParcelle || isGenerating}
                    className={`w-full px-6 py-4 font-sans font-medium text-white transition-colors ${
                      !selectedParcelle || isGenerating
                        ? "bg-tech-gray/50 cursor-not-allowed"
                        : "bg-ochre-terre hover:bg-ochre-terre/90"
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Génération en cours...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>📄</span>
                        Générer DDS
                      </span>
                    )}
                  </button>

                  {/* DDS généré */}
                  {generatedDDS && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <span>✅</span>
                        <span className="font-semibold">
                          DDS généré avec succès
                        </span>
                      </div>
                      <div className="data-text text-green-800 mb-3">
                        Référence : {generatedDDS}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-congo-cyan text-white text-sm hover:bg-congo-cyan/90">
                          📥 Télécharger PDF
                        </button>
                        <button className="px-4 py-2 border border-congo-cyan text-congo-cyan text-sm hover:bg-congo-cyan/10">
                          📧 Envoyer par email
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Historique */}
            <div className="bg-white border border-tech-gray/20 p-6">
              <h3 className="font-sans font-semibold text-ink-black mb-6">
                Historique des DDS (session)
              </h3>

              {ddsHistory.length === 0 ? (
                <div className="text-center py-12 text-tech-gray">
                  <div className="text-3xl mb-4">📋</div>
                  <p>Aucun DDS généré dans cette session</p>
                  <p className="text-sm mt-2">
                    Les DDS générés apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ddsHistory.map((dds) => (
                    <div
                      key={dds.id}
                      className="p-4 border border-tech-gray/20 hover:bg-light-gray/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="data-text text-congo-cyan font-bold">
                          {dds.id}
                        </div>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700">
                          ✅ Généré
                        </span>
                      </div>
                      <div className="text-sm text-ink-black mb-1">
                        {dds.parcelle}
                      </div>
                      <div className="flex justify-between text-xs text-tech-gray">
                        <span>{dds.type}</span>
                        <span>{dds.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-tech-gray/20">
                <div className="flex justify-between text-sm">
                  <span className="text-tech-gray">Total DDS cette session</span>
                  <span className="data-text text-congo-cyan font-bold">
                    {ddsHistory.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info EUDR */}
          <div className="mt-6 bg-ink-black text-off-white p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-congo-cyan/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-congo-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-sans font-semibold mb-2">
                  Conformité EUDR
                </h4>
                <p className="text-sm text-off-white/80 leading-relaxed">
                  Le Due Diligence Statement (DDS) certifie que les produits ne
                  proviennent pas de zones déforestées après le 31 décembre
                  2020 et respectent les législations locales. Chaque parcelle
                  est tracée géographiquement avec ses coordonnées exactes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
